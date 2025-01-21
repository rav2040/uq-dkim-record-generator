import type { NextApiRequest, NextApiResponse } from "next";

import { toFileStream } from "qrcode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const textStr = String(req.query.text);

    res.setHeader('Content-Type', 'image/png');

    const result = await toFileStream(res, textStr);

    res.status(200).end(result);
}
