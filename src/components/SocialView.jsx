// Static sample content – the social space is only a UI preview in this demo.
const POSTS = [
  { id: 1, forum: 'Fantasy workshop', author: 'Mira K.', title: 'Chapter 3 of “The Salt Road” – feedback welcome', body: 'I rewrote the market scene three times. Does the pacing work now, or does it still drag before the chase?', replies: 12 },
  { id: 2, forum: 'Short stories', author: 'Daniel P.', title: 'A 900-word story about a lighthouse keeper', body: 'Written for this week’s prompt. I would love to hear whether the ending feels earned.', replies: 7 },
  { id: 3, forum: 'Beta readers wanted', author: 'Elena V.', title: 'Looking for 2 readers for a cosy mystery', body: '60,000 words, finished first draft. I can swap for your manuscript – let’s help each other.', replies: 4 },
  { id: 4, forum: 'Writing sprints', author: 'Ivo T.', title: 'Sprint tonight, 20:00 – 45 minutes', body: 'Join, write, and post your word count afterwards. Last time we collected 11,400 words together!', replies: 21 },
];

const TITLES = {
  forums: ['Forums', 'Authors share their works and get feedback.'],
  feed: ['The feed', 'Selected posts from the forums you follow.'],
  messages: ['Direct messages', 'Talk privately with other authors, editors and readers.'],
  timeline: ['Timeline editor', 'Arrange chapters and events on a visual timeline.'],
};

export default function SocialView({ view }) {
  const [title, sub] = TITLES[view];
  const planned = view === 'messages' || view === 'timeline';
  return (
    <div className="social-view">
      <h2>{title}</h2>
      <p className="muted">{sub}</p>
      {planned ? (
        <div className="notice">Planned for a later increment – not part of this demo.</div>
      ) : (
        <>
          <div className="notice">Preview with sample content. Posting is not connected yet.</div>
          {POSTS.map((p) => (
            <article className="post" key={p.id}>
              <div className="post-meta">
                <span className="tag"># {p.forum}</span> · {p.author}
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <div className="muted small">{p.replies} replies</div>
            </article>
          ))}
        </>
      )}
    </div>
  );
}
