import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const fixResults = ({ uid, first_publication_date, data }: Post): Post => {
  return {
    uid,
    first_publication_date: format(
      new Date(first_publication_date),
      "dd 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    ),
    data: {
      title: RichText.asText(data.title),
      subtitle: RichText.asText(data.subtitle),
      author: RichText.asText(data.author),
    },
  };
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results || []);
  const [nextPage, setNextPage] = useState(postsPagination.next_page || '');

  const handleLoadMorePosts = (): void => {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(response => {
          setPosts([...posts, ...response.results.map(fixResults)]);
          setNextPage(response.next_page);
        });
    }
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <Header />
      <main className={commonStyles.pageContainer}>
        {posts.map(({ uid, first_publication_date, data }) => (
          <div key={uid} className={styles.post}>
            <h3>{data.title}</h3>
            <p>{data.subtitle}</p>
            <footer>
              <div>
                <img src="/calendar.svg" alt="Data publicação" />
                <span>{first_publication_date}</span>
              </div>
              <div>
                <img src="/user.svg" alt="Autor" />
                <span>{data.author}</span>
              </div>
            </footer>
          </div>
        ))}
        {!!nextPage && (
          <div className={styles.loadMorePosts}>
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 1 }
  );

  const results = postsResponse.results.map(fixResults);

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
