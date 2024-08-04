<script lang="ts">
    import { updated } from "$app/stores";
    import { PUBLIC_API_URL } from "$env/static/public";
    import axios from "axios";

    let apiUrl =
        import.meta.env.VITE_API_URL ??
        PUBLIC_API_URL ??
        "http://localhost:3001";
    let username: string = "";
    let roastingResult: string = "";
    let status: string = "idle";

    async function fetchGithubData() {
        if (!username || status == "loading") return;
        status = "loading";
        var datas = null;
        var readmeResponse = { status: 404,data:null };
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
                            created_at : repo.created_at,
                            updated_at : repo.updated_at
                        }),
                    )
                    .slice(0, 50),
            };
        } catch (error) {
            console.error("Error fetching GitHub data in client, try in server...", error);
        }

        try {
            // Send data to Gemini AI for roasting
            const geminiResponse = await axios.post<{ roasting: string }>(
                apiUrl + "/roast?username=" + username,
                {
                    jsonData: JSON.stringify(datas),
                    README:readmeResponse.data
                },
            );
            roastingResult = geminiResponse.data.roasting;
        } catch (error : any) {
            console.error("Error : ", error);
            if(axios.isAxiosError(error)){
                //get response from error
                var responseData = error.response?.data;
                if(responseData.type == "AI"){
                    roastingResult = "AI failed to return answer, the possibility of the response being too harsh or get limit. please try again ...";
                } else if(responseData.type == "Github"){
                    roastingResult = "Error fetching GitHub data, "+responseData.error+". please try again later ...";
                } else {
                    roastingResult = "Failed to fetch response, error in server : "+error.message;
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

    <input
        type="text"
        bind:value={username}
        placeholder="Enter GitHub username"
    />
    <button on:click={fetchGithubData}>Submit</button>

    {#if status == "done"}
        <h2>Roasting Result</h2>
        <p>{roastingResult}</p>
    {:else if status == "loading"}
        <p>Loading...</p>
    {:else if status == "idle"}
        <p>Enter a GitHub username to get started.</p>
    {/if}
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
</style>
