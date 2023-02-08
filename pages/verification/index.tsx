import Head from 'next/head'
import { Inter, Fira_Mono } from '@next/font/google'
import styles from '../../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const inter = Inter({ subsets: ['latin'] })
const firaMono = Fira_Mono({ subsets: ['latin'], weight: "500" })


export default function Home() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [queryOutput, setQueryOutput] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const localStorageDomains = window.localStorage.getItem("domains");
    if (localStorageDomains) {
      setDomains(JSON.parse(localStorageDomains))
    }
  }, []);

  const onClick = async () => {
    setQueryOutput([<div style={{ marginBottom: "1rem" }}>Querying records for {domains.length} domains...</div>]);

    for (const domain of domains) {
      const dkimDomains = [
        `ubiquity-dkim-1._domainkey.${domain}`,
        `ubiquity-dkim-2._domainkey.${domain}`,
        `ubiquity-dkim-3._domainkey.${domain}`,
      ];

      const promises = dkimDomains.map(async (dkimDomain, i) => {
        const expectedRecord = `ubiquity-dkim-${i + 1}-${domain.replaceAll(".", "-")}.ses.ubiquity-prod.co.nz.`;
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${dkimDomain.trim()}&type=CNAME`, {
          headers: { accept: "application/dns-json" },
        });
        const result = await response.json()
        return result.Answer?.[0].data === expectedRecord;
      });

      const isCorrectlyConfigured = (await Promise.all(promises)).every(Boolean);
      setQueryOutput(prev => prev.concat(`${isCorrectlyConfigured ? "\u2705" : "\u274c"} ${domain}`));
      bottomRef.current?.scrollIntoView({ behavior: "auto" })
    }

    setQueryOutput(prev => prev.concat(<div style={{ marginTop: "1rem" }}>Query complete.</div>));

    window.localStorage.setItem("domains", JSON.stringify(domains))
  };

  return (
    <>
      <Head>
        <title>Ubiquity DKIM DNS record generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={[styles.main, inter.className].join(" ")}>
        <div style={{ display: "flex", gap: "5rem" }}>
          <div>
            <div>
              <TextField
                defaultValue={domains.join("\n")}
                onChange={(e) => {
                  setDomains(e.target.value.trim().split(/\n/g).filter(Boolean));
                }}
                style={{ backgroundColor: "#eee", width: "500px" }}
                placeholder="Paste a list of domains here"
                multiline
                rows={20}
              />
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <Button variant="contained" onClick={onClick} disabled={domains.length === 0}><span style={{ fontSize: "1.25rem", fontWeight: 600, padding: "0.25rem 1rem" }} >Run query</span></Button>
            </div>
          </div>
          <div>
            {queryOutput.length > 0 && <div className={firaMono.className} style={{ padding: "1rem", width: "800px", borderRadius: "4px", backgroundColor: "#333", color: "#eee", fontSize: "1.25rem" }}>
              {queryOutput.map((line, i) => <div key={i}>{line}</div>)}
            </div>}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>
    </>
  )
}
