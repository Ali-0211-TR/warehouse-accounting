// import { UnexpectedErrorDto } from '~shared/api/realworld';
// import { GenericError, isHttpErrorCode } from '~shared/lib/fetch';
import styles from './error.module.css';
import { GenericError } from "../../lib/fetch";

type ErrorHandlerProps = {
    error: GenericError<any>;
    size?: 'small' | 'medium' | 'large' | 'full';
};

export function ErrorHandler(props: ErrorHandlerProps) {
    const { error, size = 'medium' } = props;
    const className = `${styles.wrapper} ${styles[`loader-${size}`]}`;

    return (
        <div className={className}>
            <ul className="error-messages">
                <li key={error.errorType}>{error.explanation}</li>
            </ul>
        </div>
    );
}
