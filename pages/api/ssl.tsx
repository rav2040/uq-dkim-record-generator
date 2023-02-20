import type { NextApiRequest, NextApiResponse } from "next";

import { connect } from "tls";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    let returned = false;

    const servername = String(req.query.servername)
    const connectOptions = {
        host: servername,
        port: 443,
        servername,
        rejectUnauthorized: false,
    };

    const socket = connect(connectOptions, () => {
        const peerCertificate = socket.getPeerCertificate();

        if (!peerCertificate.subject.CN.endsWith(servername)) {
            res.status(200).end("");
        }

        if (!returned) {
            returned = true;
            res.status(200).end(peerCertificate.valid_to);
            socket.destroy();
        }
    });

    setTimeout(() => {
        if (!returned) {
            returned = true;
            res.status(200).end("");
            socket.destroy();
        }
    }, 3000);

    socket.on('error', () => res.status(200).end(""));
    socket.on('close', () => console.log("Connection has closed."));
}
