import Head from 'next/head'
import { useRouter } from 'next/router'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const router = useRouter();

  const selectors = [
    "ubiquity-dkim-1",
    "ubiquity-dkim-2",
    "ubiquity-dkim-3",
  ]
  const domain = router.query.domain;

  if (!domain) return null;

  return (
    <>
      <Head>
        <title>Ubiquity DKIM DNS record generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={[styles.main, inter.className].join(" ")}>
        <h1>{domain}</h1>
        <br/>

        <p>Please add the following records using your domain's DNS provider.</p>
        <br/>
        <table>
          <tbody>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
        {selectors.map((selector) => <tr>
          <td>CNAME</td>
          <td>{selector}._domainkey.{domain}</td>
          <td>{selector}-{domain.replace(".", "-")}.amazonses.ubiquity-prod.co.nz</td>
        </tr>)}
        </tbody>
        </table>
      </main>
    </>
  )
}
