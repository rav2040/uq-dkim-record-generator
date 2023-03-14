import Head from 'next/head'
import { Inter, Fira_Mono } from '@next/font/google'
import styles from '../../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const inter = Inter({ subsets: ['latin'] })
const firaMono = Fira_Mono({ subsets: ['latin'], weight: "500" })

const exepctedCnameValues = [
  "custom.engage.ubiquity.co.nz.",
  "custom.ubiquity.co.nz."
]

const hasConflictingRecords = async (domain: string) => {
  return Promise.all(["TXT", "MX"].map(async (type) => {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
      headers: { accept: "application/dns-json" },
    });
    const result = await response.json();
    return !exepctedCnameValues.includes(result.Answer?.[0].data);
  }));
}

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

    let numCorrectlyConfigured = 0;

    await Promise.allSettled(domains.map(async (domain) => {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain.trim()}&type=CNAME`, {
        headers: { accept: "application/dns-json" },
      });
      const result = await response.json();
      const ubiquityCnameCorrectlyConfigured = result.Answer?.[0].data === "custom.engage.ubiquity.co.nz.";
      const caCnameCorrectlyConfigured = result.Answer?.[0].data === "custom.ubiquity.co.nz.";

      const isCnameConflicting = (await hasConflictingRecords(domain.trim())).some(Boolean);

      const dkimDomains = [
        `ubiquity-dkim-1._domainkey.${domain.trim()}`,
        `ubiquity-dkim-2._domainkey.${domain.trim()}`,
        `ubiquity-dkim-3._domainkey.${domain.trim()}`,
      ];

      const getSSLExpiry = async () => {
        const response = await fetch(`api/ssl?servername=${domain.trim()}`);
        const str = await response.text();
        const d = str.length ? new Date(str) : null
        return d?.toString() === "Invalid Date" ? null : d;
      };

      const exp = await getSSLExpiry();

      const promises = dkimDomains.map(async (dkimDomain, i) => {
        const expectedRecord = `ubiquity-dkim-${i + 1}-${domain.trim().replaceAll(".", "-")}.ses.ubiquity-prod.co.nz.`;
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${dkimDomain.trim()}&type=CNAME`, {
          headers: { accept: "application/dns-json" },
        });
        const result = await response.json()
        return result.Answer?.[0].data === expectedRecord;
      });

      const isDkimCorrectlyConfigured = (await Promise.all(promises)).every(Boolean);

      numCorrectlyConfigured += (
        isDkimCorrectlyConfigured && (ubiquityCnameCorrectlyConfigured || caCnameCorrectlyConfigured)
      ) ? 1 : 0

      const dkimStatus = isDkimCorrectlyConfigured ? "\u2705" : "\u274c";
      const cnameStatus = isCnameConflicting ? "\u274c" : (ubiquityCnameCorrectlyConfigured ? "\u2705" : caCnameCorrectlyConfigured ? "☑️" : "\u274c");

      setQueryOutput(prev => prev.concat(<>{dkimStatus}{cnameStatus} <span style={{ color: exp && exp.getTime() > new Date().getTime() ? "#4BB543" : "#FF9494" }}>{exp?.toLocaleDateString("en-NZ") ?? "NULL"}</span> {domain.trim()}</>));
      bottomRef.current?.scrollIntoView({ behavior: "auto" })
    }));

    setQueryOutput(prev => prev.concat(<div style={{ marginTop: "1rem" }}>Query complete. {numCorrectlyConfigured} of {domains.length} domains are correctly configured.</div>));

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
            {queryOutput.length > 0 && <div className={firaMono.className} style={{ padding: "1rem", minWidth: "800px", borderRadius: "4px", backgroundColor: "#333", color: "#eee", fontSize: "1.25rem" }}>
              {queryOutput.map((line, i) => <div key={i}>{line}</div>)}
            </div>}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>
    </>
  )
}
