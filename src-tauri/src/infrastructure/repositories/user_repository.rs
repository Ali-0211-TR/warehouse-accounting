use chrono::Utc;
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

use crate::Result;
use crate::adapters::dtos::{ChangePasswordDTO, CreateUserDTO, UpdateUserDTO};
use crate::domain::repositories::UserRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::{domain::entities::user_entity::UserEntity, shared::types::RoleType};

// use entity::prelude::UserToRole;
use entity::roles as Role;
use entity::user_to_role as UserToRole;
use entity::users as User;

use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, Condition, DatabaseConnection, EntityTrait,
    QueryFilter, Set, TransactionTrait, TryIntoModel,
};

use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString},
};

async fn load_user_roles(db: &DatabaseConnection, user_id: String) -> Result<Vec<RoleType>> {
    let roles = UserToRole::Entity::find()
        .filter(UserToRole::Column::UserId.eq(user_id))
        .find_with_related(Role::Entity)
        .all(db)
        .await?
        .into_iter()
        .flat_map(|(_, roles)| roles)
        .map(|role| RoleType::from_str(&role.name).unwrap_or_default())
        .collect();
    Ok(roles)
}

async fn into_user_entity(db: &DatabaseConnection, user: User::Model) -> Result<UserEntity> {
    let roles = load_user_roles(db, user.id.clone()).await?;
    Ok(UserEntity {
        id: Some(user.id),
        device_id: user.device_id,
        full_name: user.full_name,
        username: user.username,
        phone_number: user.phone_number,
        roles,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        version: user.version,
    })
}

impl From<User::Model> for UserEntity {
    fn from(user: User::Model) -> Self {
        UserEntity {
            id: Some(user.id),
            device_id: user.device_id,
            full_name: user.full_name,
            username: user.username,
            phone_number: user.phone_number,
            roles: [].to_vec(),
            created_at: user.created_at,
            updated_at: user.updated_at,
            deleted_at: user.deleted_at,
            version: user.version,
        }
    }
}

// impl From<CreateUserDTO> for User::ActiveModel {
//     fn from(user: CreateUserDTO) -> Self {
//         User::ActiveModel {
//             id: ActiveValue::Set(Uuid::new_v4().to_string()),
//             device_id: ActiveValue::Set("device-1".to_string()), // TODO: Get from device_config
//             full_name: ActiveValue::Set(user.full_name),
//             username: ActiveValue::Set(user.username),
//             password: ActiveValue::Set(user.password),
//             phone_number: ActiveValue::Set(user.phone_number),
//             created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
//             updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
//             deleted_at: ActiveValue::NotSet,
//             version: ActiveValue::Set(1),
//     }
//     }
// }

impl UserRepository {
    /// Get all non-deleted users (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<UserEntity>> {
        let db = db.get_db()?;
        let data: Vec<User::Model> = User::Entity::find()
            .filter(User::Column::DeletedAt.is_null())
            .all(db)
            .await?;

        let mut users_entities = Vec::new();
        for user in data {
            users_entities.push(into_user_entity(db, user).await?);
        }
        Ok(users_entities)
    }

    /// Get all users including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<UserEntity>> {
        let db = db.get_db()?;
        let data: Vec<User::Model> = User::Entity::find().all(db).await?;

        let mut users_entities = Vec::new();
        for user in data {
            users_entities.push(into_user_entity(db, user).await?);
        }
        println!("Found {} users (including deleted)", users_entities.len());
        Ok(users_entities)
    }

    pub async fn login(
        db: Arc<DataStore>,
        username: String,
        password: String,
    ) -> Result<UserEntity> {
        let db = db.get_db()?;

        let user = User::Entity::find()
            .filter(
                Condition::all()
                    .add(User::Column::Username.eq(username))
                    .add(User::Column::DeletedAt.is_null()),
            )
            .one(db)
            .await?
            .ok_or(Self::user_not_found_error())?;

        if !(user.password.is_empty() && password.is_empty()) {
            let password_hash = password_hash(password)?;
            if user.password != password_hash {
                return Err(Error::NotLoggedIn);
            }
        }
        into_user_entity(db, user).await
    }

    /// Get user by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<UserEntity> {
        let db = db.get_db()?;
        let user = User::Entity::find()
            .filter(User::Column::Id.eq(id))
            .filter(User::Column::DeletedAt.is_null())
            .one(db)
            .await?
            .ok_or(Self::user_not_found_error())?;
        into_user_entity(db, user).await
    }

    /// Get user by ID including soft-deleted users (for resolving references in shifts, orders, etc.)
    pub async fn get_by_id_including_deleted(db: Arc<DataStore>, id: String) -> Result<UserEntity> {
        let db = db.get_db()?;
        let user = User::Entity::find()
            .filter(User::Column::Id.eq(id))
            .one(db)
            .await?
            .ok_or(Self::user_not_found_error())?;
        into_user_entity(db, user).await
    }

    pub async fn create_user(
        db: Arc<DataStore>,
        data: CreateUserDTO,
        device_id: String,
    ) -> Result<UserEntity> {
        let db_con = db.get_db()?;
        let roles = data.roles.clone();

        let txn = db_con.begin().await?;
        let active_model: User::ActiveModel = {
            let now = Utc::now().to_rfc3339();
            User::ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4().to_string()),
                device_id: ActiveValue::Set(device_id),
                full_name: ActiveValue::Set(data.full_name),
                username: ActiveValue::Set(data.username),
                password: ActiveValue::Set(password_hash(data.password)?),
                phone_number: ActiveValue::Set(data.phone_number),
                created_at: ActiveValue::Set(now.clone()),
                updated_at: ActiveValue::Set(now),
                deleted_at: ActiveValue::NotSet,
                version: ActiveValue::Set(1),
            }
        };

        // Insert new user (use insert so SeaORM performs INSERT instead of UPDATE which may fail
        // when the primary key is pre-set and no record exists).
        let saved_user = active_model.insert(&txn).await?;
        let user_id = saved_user.id.clone();

        let role_names: Vec<String> = roles.iter().map(|r| r.to_string()).collect();
        let role_models = Role::Entity::find()
            .filter(Role::Column::Name.is_in(role_names))
            .all(&txn)
            .await?;

        let user_id_clone = user_id.clone();
        let user_role_models: Vec<UserToRole::ActiveModel> = role_models
            .into_iter()
            .map(|role| UserToRole::ActiveModel {
                user_id: Set(user_id_clone.clone()),
                role_id: Set(role.id),
            })
            .collect();

        if !user_role_models.is_empty() {
            UserToRole::Entity::insert_many(user_role_models)
                .exec(&txn)
                .await?;
        }

        txn.commit().await?;

        // saved_user is a Model returned by insert(); pass it directly to into_user_entity
        into_user_entity(db_con, saved_user).await
    }

    pub async fn update_user(
        db: Arc<DataStore>,
        data: UpdateUserDTO,
        device_id: String,
    ) -> Result<UserEntity> {
        let db_con = db.get_db()?;
        let id = data.id;
        let roles = data.roles.clone();

        let txn = db_con.begin().await?;
        let mut user: User::ActiveModel = User::Entity::find()
            .filter(User::Column::Id.eq(id))
            .one(&txn)
            .await?
            .ok_or(Self::user_not_found_error())?
            .into();
        user.full_name = Set(data.full_name);
        user.phone_number = Set(data.phone_number);
        user.device_id = Set(device_id);
        user.updated_at = Set(Utc::now().to_rfc3339());

        let saved_user = user.save(&txn).await?;
        let user_id = saved_user.id.clone().unwrap();

        // Delete existing roles for existing user
        UserToRole::Entity::delete_many()
            .filter(UserToRole::Column::UserId.eq(user_id.clone()))
            .exec(&txn)
            .await?;

        // Insert new roles in batch
        if !roles.is_empty() {
            let role_names: Vec<String> = roles.iter().map(|r| r.to_string()).collect();
            let role_models = Role::Entity::find()
                .filter(Role::Column::Name.is_in(role_names))
                .all(&txn)
                .await?;

            let user_role_models: Vec<UserToRole::ActiveModel> = role_models
                .into_iter()
                .map(|role| UserToRole::ActiveModel {
                    user_id: Set(user_id.clone()),
                    role_id: Set(role.id),
                })
                .collect();

            if !user_role_models.is_empty() {
                UserToRole::Entity::insert_many(user_role_models)
                    .exec(&txn)
                    .await?;
            }
        }

        txn.commit().await?;

        // Use the helper function to load user with roles
        let user_model = saved_user.try_into_model()?;
        into_user_entity(db_con, user_model).await
    }

    pub async fn change_user_password(
        db: Arc<DataStore>,
        data: ChangePasswordDTO,
    ) -> Result<UserEntity> {
        let db_con = db.get_db()?;
        let id = data.id;

        let mut user: User::ActiveModel = User::Entity::find()
            .filter(User::Column::Id.eq(id))
            .one(&db_con.clone())
            .await?
            .ok_or(Self::user_not_found_error())?
            .into();
        user.password = Set(password_hash(data.password)?);
        let saved_user = user.save(db_con).await?;

        // Use the helper function to load user with roles
        let user_model = saved_user.try_into_model()?;
        into_user_entity(db_con, user_model).await
    }

    /// Soft delete - marks user as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, user_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = User::Entity::find()
            .filter(User::Column::Id.eq(&user_id))
            .filter(User::Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::user_not_found_error())?;

        let active_model = User::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            full_name: ActiveValue::Unchanged(existing.full_name),
            username: ActiveValue::Unchanged(existing.username),
            password: ActiveValue::Unchanged(existing.password),
            phone_number: ActiveValue::Unchanged(existing.phone_number),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes user from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, user_id: String) -> Result<u64> {
        let db = db.get_db()?;

        // Delete role associations first
        UserToRole::Entity::delete_many()
            .filter(UserToRole::Column::UserId.eq(user_id.clone()))
            .exec(&db.clone())
            .await?;

        // Then delete the user
        let res = User::Entity::delete_many()
            .filter(User::Column::Id.eq(user_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted user
    pub async fn restore(db: Arc<DataStore>, user_id: String) -> Result<UserEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = User::Entity::find()
            .filter(User::Column::Id.eq(&user_id))
            .one(db_conn)
            .await?
            .ok_or(Self::user_not_found_error())?;

        let active_model = User::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            full_name: ActiveValue::Unchanged(existing.full_name),
            username: ActiveValue::Unchanged(existing.username),
            password: ActiveValue::Unchanged(existing.password),
            phone_number: ActiveValue::Unchanged(existing.phone_number),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_user_entity(db_conn, res).await
    }

    fn user_not_found_error() -> Error {
        Error::DBDataNotFound("user_not_found".to_string())
    }
}

fn password_hash(password: String) -> Result<String> {
    let argon2 = Argon2::default();
    let salt = SaltString::from_b64("c29tZXNhbHQ")
        .map_err(|_| Error::General("invalid_salt".to_owned()))?;
    // let salt = SaltString::generate(&mut OsRng);
    // let salt = [0x02; 16];
    // let salt = SaltString::generate(&mut OsRng);
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| Error::General("hashing_failed".to_owned()))?
        .to_string();
    Ok(password_hash)
}
