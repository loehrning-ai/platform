# Talking and hiring

A sentence on a website costs nothing. A job ad costs time, money and a conversation about which task the firm actually wants to hand over. So I looked at where AI jobs are advertised and whether that matches the talk on the websites.

## Who advertises

Job ads were collected with 18 search terms from data, analytics and AI (for example data engineer, machine learning, AI), from 28 February to 16 June 2026. A job counts as an AI job if its title points to AI, machine learning or data science. The same title from the same employer counts once, even if it appears in several cities or on several portals. That leaves {{c10.postings}} jobs from {{c10.employers}} employers (another {{c10.postings_no_employer}} without a recognisable employer).

Two thirds of these employers, exactly {{c10.single_share.num}} percent, advertise only a single job title (counted by ads, {{c10.single_share_ads.num}} percent). The ten percent with the most jobs account for {{c10.top10_share.num}} percent of all AI jobs, with an interval of {{c10.top10_share.range}}, and the top five percent for {{c10.top5_share.num}} percent.

::figure{id="C10"}

The more the curve sags, the more unevenly the jobs are spread.

What gets counted are ads, not hires. The selection depends on the 18 search terms. Large employers are probably overrepresented on job portals. The time window covers only three and a half months. This is not a number for the whole of Germany.

## Where jobs are advertised

By state, the jobs lie much further apart than the talk. Per million inhabitants, the span between the highest and the lowest state is about {{c11.spread_postings.num}} times for AI jobs and only about {{c11.spread_website.num}} times for company pages with the AI word. So that both fit on one scale, the average of the states stands at 100: for jobs, Berlin reaches {{c11.be.a}} and Schleswig-Holstein {{c11.sh.a}}. Both spans are ratios between the highest and the lowest state and depend on a few small states; there is no interval for them.

Both point the same way: states with many job ads also tend to talk about AI more often. The rank correlation is {{c11.rho.num}}. The interval, however, runs from {{c11.rho.lo}} to {{c11.rho.hi}}, and with so few states the link remains a tendency on which I would not base any statement about single regions. Two more states appear only with their jobs, because their websites show fewer than five hits. Jobs also carry the place of the job, websites the seat of the firm.

::figure{id="C11"}

The further apart the two dots of a state lie, the less talking and advertising match there.

State values say nothing about single firms. Nor can a cause be read from them: perhaps firms there talk more about AI because they are hiring, perhaps it comes down to industry or to the size of the cities, or to the portals that were queried.

## What this means for you

Talk is spread widely, advertising is more uneven. If a competitor mentions AI on its page, that says little about its plans. A job says more, because someone has set aside money for it and described a task, but even a job is not yet a rollout.

So next to the website, look at the open jobs of a provider or competitor. If you are hiring yourself, write the ad so that people can tell which task AI is meant for. Better than "AI expert wanted" is: "We are looking for someone to prepare and check our quotes with a language model."
