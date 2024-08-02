<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public'
    import axios from "axios";

    let apiUrl = PUBLIC_API_URL ?? "http://localhost:3001";
    let username: string = '';
    let roastingResult: string = '';
    let status : string = 'idle';

    async function fetchGithubData() {
        if (!username) return;
        status = 'loading';
        try {
           
            // Send data to Gemini AI for roasting
            const geminiResponse = await axios.post<{ roasting: string }>(apiUrl+'/roast?username='+username);
            roastingResult = geminiResponse.data.roasting;

        } catch (error) {
            console.error('Error fetching GitHub data', error);
            roastingResult = 'Failed to fetch GitHub data. please try again ...';
        }
        status = 'done';
    }
</script>
<svelte:head>
    <title>GitHub Profile Roasting 🔥🔥🔥</title>
</svelte:head>
<main>
    <h1>GitHub Profile Roasting 🔥🔥🔥</h1>
    
    <input type="text" bind:value={username} placeholder="Enter GitHub username" />
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