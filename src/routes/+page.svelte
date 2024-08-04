<script lang="ts">
    import { updated } from "$app/stores";
    import { PUBLIC_API_URL } from "$env/static/public";
    import axios from "axios";

    let apiUrl =
        import.meta.env.VITE_API_URL ??
        PUBLIC_API_URL ??
        "http://localhost:3001";
    let username: string = "";
    let model: string = "gemini";
    let language: string = "auto";
    let roastingResult: string = "";
    let status: string = "idle";

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
            const headers = {
                Origin:window.location.origin,
                Referer:`${window.location.origin}/`
            }
            console.log(headers);
            // Send data to Gemini AI for roasting
            const geminiResponse = await axios.post<{ roasting: string }>(
                apiUrl + "/roast?username=" + username,
                {
                    jsonData: JSON.stringify(datas),
                    README: readmeResponse.data,
                    model:model,
                    language:language
                },
                {
                    headers:headers
                }
            );
            roastingResult = geminiResponse.data.roasting;
        } catch (error: any) {
            console.error("Error : ", error);
            if (axios.isAxiosError(error)) {
                //get response from error
                var responseData = error.response?.data;
                if(responseData != undefined && responseData.error){
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
</svelte:head>
<main>
    <h1>GitHub Profile Roasting 🔥🔥🔥</h1>

    <div>
        <input
            type="text"
            bind:value={username}
            placeholder="Enter GitHub username"
        />
        <button on:click={fetchGithubData}>Submit</button>
    </div>
    {#if status == "idle"}
        <p>Enter a GitHub username to get started.</p>
    {/if}
    <br>
    <details>
        <summary>Setting</summary>
        <div class="input-group">
            <label for="language">Language</label>
            <select bind:value={language} name="language" id="language">
                <option value="auto">Auto</option>
                <option value="english">English</option>
                <option value="indonesia">Indonesia</option>
            </select>
        </div>
        <div class="input-group">
            <label for="model">AI Model</label>
            <select bind:value={model} name="model" id="model">
                <option value="gemini">Gemini AI</option>
                <option value="llama">LLama</option>
            </select>
        </div>
    </details>

    {#if status == "done"}
        <h2>Roasting For {username}</h2>
        <p>{roastingResult}</p>
    {:else if status == "loading"}
        <p>Loading...</p>
    {/if}
    <div id="footer">
        <center>
            <p>Bantu Saya Bayar Tagihan GCP 😭</p>
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
        </center>
    </div>
</main>

<style>
    main {
        padding: 1em;
        max-width: 800px;
        margin: 0 auto;
    }
    input {
        margin-right: 0.5em;
        padding: 0.5em;
    }
    button {
        padding: 0.5em;
    }
    ul {
        list-style-type: none;
        padding: 0;
    }
    li {
        margin-bottom: 0.5em;
    }
    pre {
        background: #f4f4f4;
        padding: 1em;
        overflow-x: auto;
    }

    #footer {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        padding: 16px;
    }

    .input-group {
        margin-bottom: 16px;
        display: flex;
        gap: 6px;
        flex-direction: column;
    }
</style>
