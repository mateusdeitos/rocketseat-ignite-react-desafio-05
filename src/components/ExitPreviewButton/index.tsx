import Link from 'next/link';
import styles from './styles.module.scss';

export const ExitPreviewButton = (): JSX.Element => {
  return (
    <aside className={styles.previewButton}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
};
