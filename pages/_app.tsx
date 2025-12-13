import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>naumu</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;700&display=swap" rel="stylesheet" />
                <link rel="icon" type="image/png" href="/favicon.png" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
