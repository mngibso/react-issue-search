import axios from "axios";
import * as express from 'express';


//import * as NodeCache from "node-cache";
import NodeCache = require("node-cache");

// cache api query results
const IssueCache = new NodeCache( { stdTTL: 300, checkperiod: 120 } );
const githubUri = "https://api.github.com/search/issues";
const org = "facebook";
const repo = "facebook/react";
const type = "issue";
export const get = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    let { q, limit = 50 } = req.query;
    if (!q) {
        return res.json({ items: [] });
    }
    q = `${q} in:title type:${type} org:${org} repo:${repo}`;
    const conf = {
        params: {
            q: q.trim(),
            per_page: limit,
            sort: "updated"
        }
    };
    const hash = `${q}-${limit}`;
    const cachedItems = IssueCache.get(hash);
    if (cachedItems) {
        return res.json( { items: cachedItems } )
    }

    try {
        const resp = await axios.get(githubUri, conf);
        const { data } = resp;
        const { items = [] } = data;
        const itemsMap = items
            .map( (v: any) => ({
                title: v.title,
                url: v.html_url,
                labels: v.labels,
            }));
        IssueCache.set(hash, itemsMap);
        res.json( { items: itemsMap } )
    } catch (err) {
        console.log("error");
        console.error(err);
        res.sendStatus(err.response?.status || 500)
    }
}
