import type { NextApiRequest, NextApiResponse } from "next";

import { toFileStream } from "qrcode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const textStr = String(req.query.text);

    res.setHeader('Content-Type', 'image/png');
    res.status(200);

    const result = await toFileStream(res, textStr);

    res.end(result);
}
