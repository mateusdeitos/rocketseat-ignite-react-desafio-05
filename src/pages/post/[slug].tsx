/* eslint-disable react/no-danger */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      };
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>

      <main className={commonStyles.pageContainer}>
        <article className={styles.container}>
          <h1>{post.data.title}</h1>
          <section className={styles.details}>
            <div>
              <img src="/calendar.svg" alt="Autor" />
              <span>{post.first_publication_date}</span>
            </div>
            <div>
              <img src="/user.svg" alt="Autor" />
              <span>{post.data.author}</span>
            </div>
            <div>
              <img src="/clock.svg" alt="Autor" />
              <span>4 min</span>
            </div>
          </section>
          <section className={styles.content}>
            {(post?.data?.content || []).map(({ body, heading }) => (
              <section
                key={encodeURIComponent(heading)}
                className={styles.contentSection}
              >
                <h2>{heading}</h2>

                <div
                  dangerouslySetInnerHTML={{
                    __html: body.text,
                  }}
                />
              </section>
            ))}
          </section>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: slug,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    data: {
      title: RichText.asText(response.data.title),
      subtitle: RichText.asText(response.data.subtitle),
      author: RichText.asText(response.data.author),
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(({ heading, body }) => ({
        body: {
          text: RichText.asHtml(body),
        },
        heading: RichText.asText(heading),
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
