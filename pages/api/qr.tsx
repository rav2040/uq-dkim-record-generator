import type { NextApiRequest, NextApiResponse } from "next";

import { toBuffer } from "qrcode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const textStr = String(req.query.text);

    const result = await toBuffer(textStr);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', result.byteLength);
    res.status(200).end(result);
}
