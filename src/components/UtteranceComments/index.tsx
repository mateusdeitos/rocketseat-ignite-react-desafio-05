/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useState, useRef, useEffect } from 'react';
import styles from './styles.module.scss';

export const UtteranceComments = (): JSX.Element => {
  const [pending, setPending] = useState(true);
  const reference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://utteranc.es/client.js';
    scriptElement.async = true;
    scriptElement.setAttribute(
      'repo',
      'mateusdeitos/rocketseat-ignite-react-desafio-05'
    );
    scriptElement.setAttribute('crossorigin', 'annonymous');
    scriptElement.setAttribute('theme', 'github-dark');
    scriptElement.setAttribute('issue-term', 'pathname');
    scriptElement.onload = () => setPending(false);

    reference.current.appendChild(scriptElement);
  }, []);

  return (
    <div className={styles.comments} ref={reference}>
      {pending && <p>Loading Comments...</p>}
    </div>
  );
};
