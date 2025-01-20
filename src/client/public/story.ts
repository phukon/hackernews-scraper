async function loadStoryDetails() {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('id');
    const storyContent = document.getElementById('story-content');

    if (!storyId || !storyContent) {
        if (storyContent) {
            storyContent.innerHTML = '<div class="error">Invalid story ID</div>';
        }
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/v0/story/${storyId}`);
        if (!response.ok) {
            throw new Error('Story not found');
        }

        const data = await response.json();
        const story = data.story;
        console.log(story);
        
        storyContent.innerHTML = `
            <h2 class="story-title">${story.title}</h2>
            <div class="story-meta">
                <span>By: ${story.by}</span>
                <span>Score: ${story.score}</span>
                <span>Time: ${new Date(story.hackernews_time * 1000).toLocaleString()}</span>
            </div>
            ${story.url ? `<div class="story-url"><a href="${story.url}" target="_blank">Original Article →</a></div>` : ''}
            ${story.text ? `<div class="story-text">${story.text}</div>` : ''}
        `;
    } catch (error) {
        storyContent.innerHTML = `<div class="error">Error loading story: ${error}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadStoryDetails); 