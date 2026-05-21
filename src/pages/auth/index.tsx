import type { GetServerSideProps } from 'next';

export default function AuthIndexPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/auth/login',
    permanent: false,
  },
});
