/* eslint-disable react/no-danger */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';
import Header from '../../components/Header';
import { UtteranceComments } from '../../components/UtteranceComments';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    nextPost: {
      uid?: string;
      title?: string;
    };
    prevPost: {
      uid?: string;
      title?: string;
    };
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
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
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
      {post.data?.banner?.url && (
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
      )}

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
          <hr className={styles.divider} />
          <footer className={styles.navigationFooter}>
            {post.data.prevPost.uid && (
              <Link href={`/post/${post.data.prevPost.uid}`}>
                <div>
                  <span>{post.data.prevPost.title}</span>
                  <a>Post anterior</a>
                </div>
              </Link>
            )}
            {post.data.nextPost.uid && (
              <Link href={`/post/${post.data.nextPost.uid}`}>
                <div>
                  <span>{post.data.nextPost.title}</span>
                  <a>Próximo post</a>
                </div>
              </Link>
            )}
          </footer>
        </article>
        <UtteranceComments />
        {preview && <ExitPreviewButton />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 10, fetch: ['posts.uid'] }
  );

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const next = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'posts'),
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      fetch: ['posts.uid', 'posts.title'],
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date desc]',
    }
  );
  const prev = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'posts'),
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      fetch: ['posts.uid', 'posts.title'],
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextIndex = next.results.length - 1;
  const prevIndex = prev.results.length - 1;
  const hasNextPost = Boolean(next.results[nextIndex]);
  const hasPrevPost = Boolean(prev.results[prevIndex]);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      nextPost: {
        uid: hasNextPost ? next.results[nextIndex].uid : null,
        title: hasNextPost ? next.results[nextIndex].data.title : null,
      },
      prevPost: {
        uid: hasPrevPost ? prev.results[prevIndex].uid : null,
        title: hasPrevPost ? prev.results[prevIndex].data.title : null,
      },
      title: response?.data?.title,
      subtitle: response?.data?.subtitle,
      author: response?.data?.author,
      banner: {
        url: response?.data?.banner?.url ?? null,
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
      preview,
    },
  };
};
