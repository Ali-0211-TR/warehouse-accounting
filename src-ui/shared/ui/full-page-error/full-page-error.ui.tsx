// import { GenericError } from '~shared/lib/fetch';
import { ErrorHandler } from '../error';
import styles from './full-page-error.module.css';
import { GenericError } from "../../lib/fetch";
import { pathKeys } from "../../lib/react-router";
import { Link } from "react-router-dom";

type FullPageErrorProps = {
    error: GenericError<any>;
};

export function FullPageError(props: FullPageErrorProps) {
    const { error } = props;

    return (
        <div className={styles['outer-wrapper']}>
            <div className={styles['inner-wrapper']}>
                <div className="container">
                    <h1 className="logo-font">Чтото пошло не так:</h1>
                    <ErrorHandler error={error} size="small" />
                    <Link to={pathKeys.home()} className="btn btn-sm btn-outline-primary underline">
                        Вернутся на главную
                    </Link>
                </div>
            </div>
        </div>
    );
}
