# Industry beats state

I wanted to know who says AI on their website and where, and so I split the pages by industry and state, lastly by district, and checked what makes a difference. The clearest finding comes first. Industry separates more than region does.

## The industry

Among the industries with enough pages, AI appears most often at IT service providers, on {{c6.it_services.num}} percent of the pages. With only {{c6.it_services.n}} pages, though, the interval runs from {{c6.it_services.lo}} to {{c6.it_services.hi}}. Management consulting and PR follow with {{c6.consulting.num}} percent and publishing with {{c6.publishing.num}} percent. Among the large industries, building construction with {{c6.building.num}} percent and building installation with {{c6.installation.num}} percent name AI least, both with more than a thousand pages and therefore a narrow interval. Some smaller industries lie lower still but are not shown.

::figure{id="C6"}

The dot shows the share, the line the interval, and the fewer pages stand behind a value, the longer the line, so for IT service providers it is long.

This fits the guess that firms that sell AI also write about it. I cannot prove it. The industry is derived from keywords and not official, so the statement may partly run in a circle.

For {{c6.n_suppressed}} of {{c6.n_industries}} industries there were one to four hits, in mechanical engineering for example. I do not show these values, because such small numbers would let you guess individual firms. For a third of the firms I do not know the industry; they say AI twice as often ({{c6.no_industry_rate.num}} against {{c6.with_industry_rate.num}} percent). The order in the middle of the list is largely chance. The gaps there lie within the intervals.

## The state

By state the picture looks different. In the East without Berlin, AI appears on {{c7.east_share.num}} percent of the pages, in the West without Berlin on {{c7.west_share.num}} percent. Once the effect of industry, size and legal form is removed, an odds ratio of {{c7.or_adjusted.num}} remains with an interval of {{c7.or_adjusted.range}}. With equal characteristics, the chance of the word AI is thus a good third lower in the East. The gap comes mainly from Saxony and Mecklenburg-Western Pomerania; Brandenburg is level with the West.

The difference between the states can be shown statistically, but it is smaller than the difference between industries. It is narrow. The interval reaches almost to 1, where there would be no difference at all, and only a few hits stand behind it in the East. The sample per state is also not a random draw, and the assignment of address to firm was right in only {{c4.audit_own.num}} percent of the decidable cases (chapter 8). That accuracy did not differ visibly between states, but with 5 to 35 cases per state a difference would have had to be large.

The map shows every state as a tile of equal size, so small states do not vanish and large ones do not look exaggerated. Between individual states the intervals overlap almost everywhere. For Saxony-Anhalt and Saarland there is no value, because fewer than five hits exist there.

::figure{id="C7"}

## The district

At district level things get restless. Of {{c8.kreise_total}} districts and cities with at least 30 firms, {{c8.kreise_outside}} lie outside a 95 percent chance band after removing these three characteristics ({{c8.kreise_above}} above, {{c8.kreise_below}} below); with pure chance about {{c8.kreise_expected}} would be expected. {{c8.kreise_inside}} lie within it. The excess is small, and a map that colours every district would mostly show noise. So there is neither a map nor a ranking here.

::figure{id="C8"}

## What AI talk predicts

Finally I asked which characteristic of a firm best predicts that AI appears on its page. There is a score between 0.5 and 1.0 for that. At 0.5 one guesses like a coin toss, at 1.0 one is always right. The amount of text on the page scores {{c9.text}}, the page's technology {{c9.tech}}, the industry {{c9.industry}}, the size {{c9.size}}, the state {{c9.state}} and the legal form {{c9.legal}}.

The state alone separates firms with the AI word from those without hardly better than a coin toss, and all characteristics together reach {{c9.all}}, with size and legal form predicting little about the word on the page and the industry clearly more.

::figure{id="C9"}

Prediction is not cause. The amount of text mostly reflects how much room the word has, and its value comes from the old scan, as in chapter 3, which I want to measure again. The page's technology stands for IT-related businesses. Technology here means features of the source code. I left out an AI chatbot because the calculation would otherwise run in a circle.

> **Tip:** Compare yourself with businesses in your industry and of your size and not with the average of your state. If a value is missing for your industry, take a related one and say that it is only similar.
