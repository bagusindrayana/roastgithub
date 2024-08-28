import { json, type RequestHandler,error } from '@sveltejs/kit';
import { GoogleGenerativeAI, GoogleGenerativeAIResponseError, HarmCategory, HarmBlockThreshold, GoogleGenerativeAIError } from "@google/generative-ai";
import { Groq } from 'groq-sdk';
import axios from 'axios';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

import { GEMINI_API_KEY, GROQ_API_KEY } from '$env/static/private';

import { dev } from '$app/environment';
const limiter = new RateLimiter({
    // A rate is defined as [number, unit]
    IP: [15, 'm'], // IP address limiter
    IPUA: [10, 'm'], // IP + User Agent limiter
});

async function generateContent(model:string, prompt:string, aiService:any) {
    if (model == "llama") {
        const chatCompletion = await aiService.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-70b-versatile',
        });
        return chatCompletion.choices[0].message.content;
    } else {
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ];

        const modelAi = aiService.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
        const result = await modelAi.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}

export const POST: RequestHandler = async (event) => {
    //limit request
    if (await limiter.isLimited(event)) {
        error(429);
    }

    const allowedOrigins = ['https://roastlinkedin.vercel.app', 'roastlinkedin.vercel.app','roastlinkedin.my.id','https://roastlinkedin.my.id'];
    const origin = event.request.headers.get('origin');
    const headersCors: {
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Allow-Origin'?: string;
    } = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if(dev){
        headersCors['Access-Control-Allow-Origin'] = '*';
    } else {
        if (!allowedOrigins.includes(origin ?? '')) {
            error(403, 'Forbidden');
        } else {
            headersCors['Access-Control-Allow-Origin'] = origin!;
        }
    }
    const { username,jsonData, README, model, language, apiKey } = await event.request.json();

    if (!model || !username || !language) {
        return json({ error: "Request not complete" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
    const geminiApiKeys = geminiApiKey.split(",");
    const randomGeminiApiKey = geminiApiKeys[Math.floor(Math.random() * geminiApiKeys.length)];
    let genAI = new GoogleGenerativeAI(randomGeminiApiKey);
    let groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || GROQ_API_KEY,
    });

    if (apiKey) {
        if (model == "gemini") {
            genAI = new GoogleGenerativeAI(apiKey);
        } else {
            groq = new Groq({
                apiKey: apiKey,
            });
        }
    }

    let datas = null;

    if (jsonData) {
        try {
            datas = JSON.parse(jsonData);
        } catch (error) {
            datas = null;
            console.log("failed parse json");
        }
    }

    try {
        let readmeResponse = { status: 404, data: null };
        if (README) {
            readmeResponse = { status: 200, data: README };
        }

        let profileResponse: { status: number, data: any } = { status: 404, data: null };
        let useToken = false;

        if (!datas) {
            let headerGithub = {};
            if (process.env.GITHUB_TOKEN) {
                headerGithub = {
                    "Authorization": `token ${process.env.GITHUB_TOKEN}`,
                };
            }

            try {
                profileResponse = await axios.get(`https://api.github.com/users/${username}`, { headers: headerGithub });
                useToken = true;
            } catch (error) {
                profileResponse = await axios.get(`https://api.github.com/users/${username}`);
            }

            if (!useToken) {
                headerGithub = {};
            }
            const repoResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated`, { headers: headerGithub });

            try {
                readmeResponse = await axios.get(`https://raw.githubusercontent.com/${username}/${username}/main/README.md`, { headers: headerGithub });
            } catch (error) {
                try {
                    readmeResponse = await axios.get(`https://raw.githubusercontent.com/${username}/${username}/master/README.md`, { headers: headerGithub });
                } catch (error) {
                    console.log("failed get readme");
                }
            }
            datas = {
                "name": profileResponse.data.name,
                "bio": profileResponse.data.bio,
                "company": profileResponse.data.company,
                "location": profileResponse.data.location,
                "followers": profileResponse.data.followers,
                "following": profileResponse.data.following,
                "public_repos": profileResponse.data.public_repos,
                "created_at": profileResponse.data.created_at,
                "updated_at": profileResponse.data.updated_at,
                "repositories": repoResponse.data.map((repo:any) => ({
                    "name": repo.name,
                    "description": repo.description,
                    "language": repo.language,
                    "stargazers_count": repo.stargazers_count,
                    "open_issues_count": repo.open_issues_count,
                    "license": repo.license,
                    "fork": repo.fork,
                    "created_at": repo.created_at,
                    "updated_at": repo.updated_at
                })).slice(0, 50),
            };
        } else {
            profileResponse = { status: 200, data: datas };
        }

        let prompt = `berikan roasting singkat dengan kejam,menyindir, serta menyakitkan dalam bahasa gaul untuk profile github berikut : ${username}. Berikut detailnya: "${JSON.stringify(datas)}"`;

        if ((profileResponse.data && profileResponse.data.location && !profileResponse.data.location.includes('Indonesia') && language == "auto") || language == "english") {
            prompt = `give a short and harsh roasting for the following github profile: ${username}. Here are the details: "${JSON.stringify(datas)}"`;
        }
        if (readmeResponse.status === 200 && readmeResponse.data) {
            prompt += ", Profile Markdown: ```" + readmeResponse.data + "```";
        } else {
            prompt += `, Profile Markdown: Not Found`;
        }

        if ((profileResponse.data && profileResponse.data.location && !profileResponse.data.location.includes('Indonesia') && language == "auto") || language == "english") {
            prompt += `. (provide the response in English and do not provide praise or advice)`;
        } else {
            prompt += `. (berikan response dalam bahasa indonesia dan jangan berikan pujian atau saran)`;
        }

        if (profileResponse.status == 404) {
            return json({ error: "User not found", type: "Github" }, { status: 404 });
        }

        let result;
        if (model == "llama") {
            result = await generateContent(model, prompt, groq);
        } else {
            result = await generateContent(model ?? "gemini", prompt, genAI);
        }

        return json({ roasting: result });
    } catch (error:any) {
        console.log(error);
        if (error instanceof GoogleGenerativeAIResponseError || error instanceof GoogleGenerativeAIError) {
            return json({ error: error.message, type: "AI" }, { status: 500 });
        }
        if (axios.isAxiosError(error)) {
            if (error.response != undefined && error.response.status == 404) {
                return json({ error: "User not found", type: "Github" }, { status: 404 });
            } else if (error.response != undefined && error.response.status == 403) {
                return json({ error: "Reached github api limit", type: "Github" }, { status: 403 });
            } else {
                return json({ error: error.message, type: "Github" }, { status: 500 });
            }
        }
        return json({ error: error.message, type: "Server" }, { status: 500 });
    }
};