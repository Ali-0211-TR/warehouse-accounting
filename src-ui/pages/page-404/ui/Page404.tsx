import { Link } from 'react-router-dom';
import styles from './page-404.module.css';
import { pathKeys } from '../../../shared/lib/react-router';

export function Page404() {
    return (
        <div className='h-full align-content-center' >
            <div className={styles['inner-wrapper']}>
                <div className="container">
                    <h1 className="logo-font">Страница не найдена!</h1>
                    <p>Возможно данная страница на стадии разработки.</p>
                    <Link to={pathKeys.home()} className="btn btn-sm btn-outline-primary underline">
                        Вернутся на главную
                    </Link>
                </div>
            </div>
        </div>
    );
}