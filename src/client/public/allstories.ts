interface Story {
    id: string;
    title: string;
    by: string;
    score: number;
    hackernews_time: number;
    url?: string;
    hn_id: number;
}

async function loadAllStories() {
    const storiesList = document.getElementById('stories-list');
    
    if (!storiesList) {
        console.error('Stories list container not found');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/v0/story/all');
        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }

        const stories: Story[] = await response.json();
        
        storiesList.innerHTML = stories.map(story => `
            <div class="story-card">
                <h3 class="story-title">
                    <a href="story.html?id=${story.hn_id}">${story.title}</a>
                </h3>
                <div class="story-meta">
                    <span>By: ${story.by}</span>
                    <span>Score: ${story.score}</span>
                    <span>Time: ${new Date(story.hackernews_time * 1000).toLocaleString()}</span>
                </div>
                ${story.url ? `<div class="story-url"><a href="${story.url}" target="_blank">Original Article →</a></div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        storiesList.innerHTML = `<div class="error">Error loading stories: ${error}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadAllStories); 