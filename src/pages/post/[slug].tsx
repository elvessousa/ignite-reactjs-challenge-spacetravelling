import { GetStaticPaths, GetStaticProps } from 'next';
import { ReactElement } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface PostContent {
  heading: string;
  body: {
    text: string;
  }[];
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: PostContent[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const { title, banner, author, content } = post.data;
  const wordCount = content.reduce((acc, item) => {
    const headingWords = item.heading.split(' ').length;
    const bodyWordsCount = item.body.reduce(
      (wordAmount, group) => group.text.split(' ').length + wordAmount,
      0
    );
    const total = headingWords + bodyWordsCount;
    return acc + total;
  }, 0);

  const readableDate = format(
    new Date(post.first_publication_date),
    `dd MMM yyyy`,
    { locale: ptBR }
  );

  const timetoRead = Math.ceil(wordCount / 180);

  return (
    <article className={styles.post}>
      <Head>
        <title>{title} | spacetraveling </title>
      </Head>

      <header>
        <img src={banner.url} alt={title} />
        <div className={commonStyles.container}>
          <h1>{title}</h1>
          <div className={commonStyles.info}>
            <time>
              <FiCalendar /> {readableDate}
            </time>
            <span>
              <FiUser /> {author}
            </span>
            <span>
              <FiClock /> {timetoRead} min
            </span>
          </div>
        </div>
      </header>

      {content.map(group => (
        <div key={group.heading} className={commonStyles.container}>
          <h3>{group.heading}</h3>
          <div
            dangerouslySetInnerHTML={{ __html: RichText.asHtml(group.body) }}
          />
        </div>
      ))}
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {}
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      author: response.data.author,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map((content: PostContent) => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
