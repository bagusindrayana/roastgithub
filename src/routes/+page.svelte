<script lang="ts">
    import "../app.css";
    import axios from "axios";
    import SvelteMarkdown from "svelte-markdown";

    let apiUrl = "";
    let username: string = "";
    let model: string = "gemini";
    let language: string = "auto";
    let roastingResult: string = "";
    let status: string = "idle";
    let apiKey: string = "";

    async function fetchGithubData() {
        if (!username || status == "loading") return;
        status = "loading";
        var datas = null;
        var readmeResponse = { status: 404, data: null };
        try {
            var profileResponse = await axios.get(
                `https://api.github.com/users/${username}`,
            );
            const repoResponse = await axios.get(
                `https://api.github.com/users/${username}/repos?sort=updated`,
            );

            try {
                readmeResponse = await axios.get(
                    `https://raw.githubusercontent.com/${username}/${username}/main/README.md`,
                );
            } catch (error) {
                try {
                    readmeResponse = await axios.get(
                        `https://raw.githubusercontent.com/${username}/${username}/master/README.md`,
                    );
                } catch (error) {}
            }
            datas = {
                name: profileResponse.data.name,
                bio: profileResponse.data.bio,
                company: profileResponse.data.company,
                location: profileResponse.data.location,
                followers: profileResponse.data.followers,
                following: profileResponse.data.following,
                public_repos: profileResponse.data.public_repos,
                created_at: profileResponse.data.created_at,
                updated_at: profileResponse.data.updated_at,
                repositories: repoResponse.data
                    .map(
                        (repo: {
                            name: any;
                            description: any;
                            language: any;
                            stargazers_count: any;
                            open_issues_count: any;
                            license: any;
                            fork: any;
                            created_at: any;
                            updated_at: any;
                        }) => ({
                            name: repo.name,
                            description: repo.description,
                            language: repo.language,
                            stargazers_count: repo.stargazers_count,
                            open_issues_count: repo.open_issues_count,
                            license: repo.license,
                            fork: repo.fork,
                            created_at: repo.created_at,
                            updated_at: repo.updated_at,
                        }),
                    )
                    .slice(0, 50),
            };
        } catch (error) {
            console.error(
                "Error fetching GitHub data in client, try in server...",
                error,
            );
        }

        try {
            // Send data to Gemini AI for roasting
            const geminiResponse = await axios.post<{ roasting: string }>(
                apiUrl + "/roasting",
                {
                    username: username,
                    jsonData: JSON.stringify(datas),
                    README: readmeResponse.data,
                    model: model,
                    language: language,
                    apiKey: apiKey,
                },
            );
            roastingResult = geminiResponse.data.roasting;
        } catch (error: any) {
            console.error("Error : ", error);
            if (axios.isAxiosError(error)) {
                //get response from error
                var responseData = error.response?.data;
                if (responseData != undefined && responseData.error) {
                    roastingResult =
                        "Failed to fetch response, error in server : " +
                        responseData.error;
                } else {
                    roastingResult =
                        "Failed to fetch response, error in server : " +
                        error?.message;
                }
            } else {
                roastingResult = `Failed to fetch response, something wrong : ${error?.message}. please try again later ...`;
            }
        }
        status = "done";
    }
</script>

<svelte:head>
    <title>GitHub Profile Roasting 🔥🔥🔥</title>
    <meta name="description" content="Roasting Your GitHub Profile with AI" />
</svelte:head>
<main class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div id="header">
        <marquee style="color:red;"
            >Siapkan mental anda sebelum menekan tombol submit, semua response
            digenerate oleh AI, bisa saja response yang diberikan sangat
            menyinggung anda.</marquee
        >
    </div>
    <div style="height: 100px;"></div>
    <div>
        <div
            class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl"
        >
            <div class="p-8">
                <h1
                    class="block mt-1 text-2xl leading-tight font-medium text-black my-4"
                >
                    Roast Your GitHub Profile 🔥🔥🔥
                </h1>
                <div class="mb-4">
                    <div>
                        <label for="username" class="sr-only my-2">
                            GitHub Username
                        </label>
                        <input
                            type="text"
                            autocomplete="off"
                            name="username"
                            id="username"
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4"
                            bind:value={username}
                            placeholder="Enter GitHub username"
                        />
                    </div>
                    <button
                        on:click={fetchGithubData}
                        type="submit"
                        class="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Submit
                    </button>
                </div>

                <details class="mb-4">
                    <summary>Setting</summary>
                    <div class="input-group mb-4">
                        <label for="language" class="my-2">Language</label>
                        <select
                            bind:value={language}
                            name="language"
                            id="language"
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4"
                        >
                            <option value="auto">Auto</option>
                            <option value="english">English</option>
                            <option value="indonesia">Indonesia</option>
                        </select>
                    </div>
                    <div class="input-group mb-4">
                        <label for="model" class="my-2">AI Model</label>
                        <select
                            bind:value={model}
                            name="model"
                            id="model"
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4"
                        >
                            <option value="gemini">Gemini AI</option>
                            <option value="llama">LLama (Groq AI)</option>
                        </select>
                        <input
                            type="password"
                            autocomplete="off"
                            name="apiKey"
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4 mt-2"
                            bind:value={apiKey}
                            placeholder="(Optional) API KEY..."
                        />
                    </div>
                </details>

                {#if status == "done"}
                    <div class="mt-6">
                        <h2 class="text-lg font-semibold text-gray-900">
                            Roasting For {username}
                        </h2>
                        <SvelteMarkdown source={roastingResult} />
                    </div>
                {:else if status == "loading"}
                    <p>Loading...</p>
                {/if}

                <p class="text-center mt-4">&copy; bagusindrayana</p>
            </div>
        </div>
    </div>

    <div style="height: 100px;"></div>
    <div
        id="footer"
        class="fixed left-0 right-0 p-2 flex flex-col gap-2 text-center justify-center w-full bg-white bottom-0"
    >
        <div class="flex gap-2 justify-center">
            <a
                href="https://wallofdonations.my.id"
                class="underline"
                target="_blank"
            >
                WallOfDonations
            </a>
            <a
                href="https://roastgithub.my.id"
                class="underline"
                target="_blank">RoastGithub</a
            >
            <a
                href="https://roastlinkedin.my.id"
                class="underline"
                target="_blank">RoastLinkedin</a
            >
            <a href="https://roastwaifu.my.id" class="underline" target="_blank"
                >RoastWaifu</a
            >
        </div>
        <div class="flex justify-center gap-2 items-center">
            <a href="https://trakteer.id/bagood" target="_blank"
                ><img
                    id="wse-buttons-preview"
                    src="https://cdn.trakteer.id/images/embed/trbtn-red-1.png?date=18-11-2023"
                    height="40"
                    style="border: 0px; height: 40px; --darkreader-inline-border-top: 0px; --darkreader-inline-border-right: 0px; --darkreader-inline-border-bottom: 0px; --darkreader-inline-border-left: 0px;"
                    alt="Trakteer Saya"
                    data-darkreader-inline-border-top=""
                    data-darkreader-inline-border-right=""
                    data-darkreader-inline-border-bottom=""
                    data-darkreader-inline-border-left=""
                /></a
            >
            <iframe
                src="https://ghbtns.com/github-btn.html?user=bagusindrayana&repo=roastgithub&type=star&count=true&size=large"
                frameborder="0"
                scrolling="0"
                width="170"
                height="30"
                title="GitHub"
            ></iframe>
        </div>
    </div>
</main>

<style>
    #header {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        margin: auto;
        padding: 16px;
        text-align: center;
        background-color: white;
    }
</style>
