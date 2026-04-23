## TO-DO

### Important backend / logic stuff
1. Needs to be scalable, apply caching techniques for stuff like item emoji image urls, item image colors etc.
2. Logic for filters / options on item market visualizer, currently re-fetches everything again when any filter/option is toggled/changed. Figure out any other stuff logical issues to improve on excessive API calls. Let filters be applied on data POST API call and not PRE API call.
3. When there are too many data points on market visualizer, it starts getting laggy. Figure out solution for this.
4. Caching techniques for market visualizer too, cuz goddamn. Implement selective data fetching that only retrieves segments not already present in cache, avoiding redundant requests for data that has been previously loaded.
5. Toggleable option in market visualizer under `data options` for `exclude ⏣ 1 trades` filter.
6. Replace market stats placeholder in `sidepanel` with actual functionality with similar style as Value trend stuff (chart, buttons etc.) For chart buttons, add option to pick between last 100, 500, 1000 trades.
7. For some reason, using the direct url for different pages shows `404 not found` on vercel hosting (fine on localhost). So, gotta figure out routing issues. Page routing works fine on host when navigating through buttons/navbar however.
8. Enable `exclude outliers` by default (but not applying pre API call, applying post API call via frontend). 
9. Make advanced outlier threshold sliders which can support separate thresholds for separate items.
10. `Match whole case`, `StartsWith` toggle buttons on all search bars with respective logic.
11. When ONLY ONE item (multiple items wont work) is selected in `ItemMarketVisualizer`, add a toggleable button `Dual Mode` beside the `trade type` button (lock trade type to `all trades` when `Dual mode` is toggled `ON`). This toggle will make all the SELL trade data points GREEN and BUY as RED and have 2 separate GREEN/RED moving avg lines. Without the toggle, the chart only shows a single moving avg line for ALL data points and all data elements are color matched to item colors.


### UI/UX stuff
✅ 1. Match checkbox style of `data options` checkboxes to match checkbox style in `itemmultiselect` component.
✅ 2. `itemcard2` component implementation in `AllItemsOverview` page doesnt have consistent sizes when item names are longer (all of them should be equal sized squares).
3. Currently zooming on chart doesnt have scrollbars so you have to unzoom and zoom again to see a different part, if possible figure this out.
4. Whole website is not responsive and terrible for mobile devices, gotta fix this.
✅ 5. Show placeholder divs with info about the page on `ItemValueVisualizer` / `ItemMarketVisualizer` pages are opened and "display" has not been clicked yet (basically when no data is alr being displayed).
6. Better home page with info about the site itself. Dont remove the existing stuff on homepage, add stuff over it.
✅ 7. better ui for `itemcard` component.
8. Dynamic `ItemValueVisualizer` chart animation durations because when there are more data points it feels sluggish. So normalize this. 
9. In the `ItemValueVisualizer` chart, ensure that when a line is hovered, both the non-hovered lines and their corresponding data points reduce in opacity. Currently, only the lines are affected, the data points remain unchanged for some reason.
✅ 10. Chart data tooltips need to be wider when displaying longer item names because those are getting clipped.
✅ 11. `itemcard` only shows info for item-values, however we are using that same component for `ItemMarketVisualizer`. Instead, make a separate component for that which will have relevant info about trades and all with similar style as `itemcard` and use that.
✅ 12. In `ItemValueVisualizer` chart legends, the colored square sometimes gets squeezed when item names are long, fix this.


### Structural & security stuff
1. Project needs better modularization.
2. Look into improving security of backend API.
3. Whole project needs better error handling and failsafes.