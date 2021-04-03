/* eslint-disable react/no-danger */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const minutesToRead = Math.ceil(
    post.data.content
      .map(content => {
        const headingWords = +content.heading.split(' ').length;
        const bodyWords = +RichText.asText(content.body).split(' ').length;
        const total = headingWords + bodyWords;
        return total;
      })
      .reduce((acc, value) => {
        return acc + value;
      }) / 200
  );

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
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div>
              <img src="/user.svg" alt="Autor" />
              <span>{post.data.author}</span>
            </div>
            <div>
              <img src="/clock.svg" alt="Autor" />
              <span>{minutesToRead} min</span>
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
                    __html: RichText.asHtml(body),
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
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response?.data?.title,
      subtitle: response?.data?.subtitle,
      author: response?.data?.author,
      banner: {
        url: response?.data?.banner.url,
      },
      content: response?.data?.content.map(({ heading, body }) => ({
        body: body.map(({ text, type, spans }) => ({
          text,
          type,
          spans,
        })),
        heading,
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
