## TO-DO

### Important backend / logic stuff
1. When there are too many data points on market visualizer, it starts getting laggy. Figure out solution for this.
2. Backend needs to support the existing data on `pets`, `petmarketlogs`, not implemented current. `pets` /`petmarketlogs` have same db format as `items` / `marketlogs` resp.

### UI/UX stuff
1. Better home page with info about the site itself.
2. Home page to display `Total trades`, `Total volume`, `Total sell trades`, `Volume of sell trades`, `Total buy trades`, `Volume of buy trades`, `Total private trades` ... etc 
3. Sidepanel to include more data from `complete-item-data.json` for items also item specific data like `Total trades`, `Total volume`, `Total sell trades`, `Volume of sell trades`, `Total buy trades`, `Volume of buy trades`, `Total private trades` ... etc
4. After pets backend, make pets frontend which is exactly same as items stuff (except pets wont have itemvalue page and sidepanel only market)

### Structural & security stuff
1. Project needs better modularization.
2. Look into improving security of backend API.
3. Whole project needs better error handling and failsafes.