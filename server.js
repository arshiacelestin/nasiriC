const express = require("express");
const multer = require("multer");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {cors: {origin: "*"}});
const signers = require("./models/signers");
const port = process.env.PORT
const Team = require("./models/Teams");
const Transactions = require("./models/Transaction");
const Stocks = require("./models/Stocks");
const Reprots = require("./models/Reports");
const User = require("./models/User");
const pn = require("./models/teamsPN");
const TeamStock = require("./models/TeamStock");
const Notification = require("./models/Notification");
const session = require("express-session");
const Stock = require("./models/Stocks");
const Transaction = require("./models/Transaction");
const Info = require("./models/Info");
const offer =  require("./models/Offer");
const path = require("path");

let logout = true;


mongoose.connect("mongodb+srv://gjouh25_db_user:Ax2Y61EolfYG4D6S@nasiric.n4sw0cd.mongodb.net/nasiriC?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=> console.log("connected to DB")).catch((err)=>console.error("fuck"));


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const dir = path.join(__dirname, "public", "images");
        cb(null, dir);
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({storage})

app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: "supersercretkeyformysessionthatnooneknowsabout",
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
}));



app.get("/", async (req, res)=>{
    if(!logout) req.session.user = null;
    if(req.session.user && req.session.user.status == "user"){
        const team = await Team.findById(req.session.user.team_id);
        const n = team.net_worth;
        let p = "";
        let p_net = await pn.find({team_id: team._id}).lean();



        //d
        p_net = p_net[0].pn;

        p = (n-p_net)/(p_net);

        

        let color = "none";
        let sign = "";
        
        
        //p = (p > 0 && p != 0) ? p : -p;


        const p_n = await pn.findOne({
            team_id: team._id
        });
        const ts = await TeamStock.find({
            team_id: team._id
        });
        let value = 0;
        if(ts){
            for(let i = 0;i < ts.length;i++){
                if(ts[i].quantity > 0){
                    const stock = await Stocks.findById(ts[i].stock_id);
                    const delta = ts[i].quantity * stock.price;
                    value += delta;
                }
            }
            console.log(`value: ${value}, net_worth: ${team.net_worth}, pn: ${p_n.pn}`);
            p = ((team.net_worth + value) - (p_n.pn))/(p_n.pn);
        }else{
            p = 0;
        }
        color = (p > 0 && p != 0) ? "Green" : "Red";
        sign = (p > 0 && p != 0) ? "+" : "";

        const stocks = await Stocks.find().lean();

        let number_of_notifs = 0;
        const notifs = await Notification.find().lean();
        for(let i = 0;i < notifs.length;i++){
            number_of_notifs++;
        }

        res.render("panel.ejs", {"username": req.session.user.username, "team_name": team.name, "team_color": team.color, "net_worth": n.toLocaleString(), "p": p, "color": color, "sign": sign, "stocks": stocks, "non": number_of_notifs, "team_id": team._id});
    }else{
        res.redirect("/login");
    }
});


app.get("/admin/login", (req, res)=>{
    if(!logout) req.session.user = null;
    if(req.session.user && req.session.user.status !== "user"){
        res.redirect("/");
    }else{
        res.render("signin.ejs");
    }
});
app.post("/admin/login", async (req, res)=>{

    if(req.session.user && req.session.status == "user") res.redirect("/");

    const {username, password} = req.body;
    console.log(`username: ${username}, password: ${password}`);
    const useR = await User.findOne({username: username, password: password, status: "admin"}).lean();
    const exists = (useR) ? true : false;
    if(exists){
        logout = true;
        req.session.user = useR;
        req.session.save(err => {
            if(err){
                console.error(err);
            }
        })
        res.redirect("/admin/panel");
    }else{
        res.redirect("/");
    }
});
app.get("/admin/panel", async (req, res)=>{
    if(!logout) req.session.user = null;
    if(req.session.user && req.session.user.status == "admin"){
        
        
        
        const teams = await Team.find().lean();
        const stocks = await Stocks.find().lean();
        const notifs = await Notification.find().lean();
        const reports = await Reprots.find().lean();
        const infos = await Info.find().lean();
        const the_dudes = [];
        for(let i = 0;i < infos.length;i++){
            const the_dude = await User.findById(infos[i].user_id);

            

            the_dudes.push(the_dude);
        }

        const users = [];
        for(let i = 0;i < reports.length;i++){
            const u = await User.findById(reports[i].user_id);
            users.push(u);
        }

        let adw = {
            "id": [],
            "offerer": [],
            "reciver": [],
            "state": []
        }
        let ofss = await offer.find();
        for(let i = 0;i < ofss.length;i++){
            adw["id"].push(ofss[i]._id);
            let oferer = await Team.findById(ofss[i].offerer);
            let reci = await Team.findById(ofss[i].reciver);
            adw["offerer"].push(oferer.name);
            adw["reciver"].push(reci.name);
            adw["state"].push(ofss[i].state);
        }

        const wanna = await signers.find();
        

        res.render("adminpanel.ejs", {"user": req.session.user, "teams": teams, "stocks": stocks, "notifs": notifs, "reports": reports, "reports_users": users, "the_dudes": the_dudes, "infos": infos, "offers": adw, "wanna": wanna});
    }else{
        res.redirect("/login");
    }
})
app.get("/login", (req, res)=>{
    if(!logout) req.session.user = null;
    res.render("login.ejs");
})
app.post("/login", async (req, res)=>{
    const {username, password} = req.body;
    const useR = await User.findOne({username: username, password: password});
    if(useR && useR.status == "user"){
        logout = true;
        req.session.user = useR;
        req.session.save(err => {
            if(err) console.error(err);
        });
        res.redirect("/");
    }else{
        res.redirect("/login");
    }
});

app.get("/stocks", async (req, res)=>{
    if(req.session.user){
        const stocks = await Stocks.find().lean();
        res.render("stocks.ejs", {"stocks": stocks, "user": req.session.user});
    }else{
        res.redirect("/login");
    }
});

app.get("/management-panel", async (req, res)=>{
    if(req.session.user && req.session.user.status != "admin"){
        const team = await Team.findById(req.session.user.team_id);
        const stocks = await Stocks.find();
        const team_stocks = await TeamStock.find(
            {
                team_id: team._id,    
            }
        );
        let total_stock_quantity = 0;
        let stock_names = [];
        let stock_prices = [];
        for(let i = 0;i < team_stocks.length;i++){
            const s = await Stocks.findById(team_stocks[i].stock_id);
            stock_names.push(s.name);
            stock_prices.push(s.price);
            total_stock_quantity += team_stocks[i].quantity;
        }
        

        const transes = await Transactions.find({
            team_id: team._id
        }).sort({createdAt: -1});
        let trs_names = [];
        let trs_prices = [];
        let trs_users = [];
        for(let i = 0;i < transes.length;i++){
            const trs = await Stocks.findById(transes[i].stock_id);
            const trs_user = await User.findById(transes[i].user_id);
            trs_names.push(trs.name);
            trs_prices.push(trs.price);
            trs_users.push(trs_user);
        }

        let net_value = 0;
        for(let i = 0;i < team_stocks.length;i++){
            const s = await Stocks.findById(team_stocks[i].stock_id);
            const value = s.price * team_stocks[i].quantity;
            net_value += value;
        }

        let profit = 0;
        const p = await pn.findOne({team_id:team._id}).lean();
        profit = ((net_value + team.net_worth) - p.pn)/(p.pn);
        
        profit = (Number(profit) * 100);

        const tms = await Team.find();

        const offers = await offer.find({
            $or: [
                {offerer: team._id},
                {reciver: team._id}
            ]
        });

        const sent = {
            "offer_id": [],
            "team": [],
            "stock": [],
            "bs": [],
            "bs_howmany": [],
            "pays_buy": [],
            "pays_how_m": [],
            "state": []
        };
        const recived = {
            "offer_id": [],
            "team": [],
            "stock": [],
            "bs": [],
            "bs_howmany": [],
            "pays_buy": [],
            "pays_how_m": [],
            "state": []
        };

        

        for(let i = 0;i < offers.length;i++){
            if(String(team._id) == offers[i].offerer){
                const t = await Team.findById(offers[i].reciver);
                const ws = await Stocks.findById(offers[i].what_stock);
                const hm = offers[i].how_many;
                const pb = (offers[i].payment_method == "money") ? "money" : await Stock.findById(offers[i].pbs);
                const pbh = offers[i].payment_amount;
                const bs = offers[i].bos;
                const s = offers[i].state;

                sent["offer_id"].push(offers[i]._id);
                sent["team"].push(t);
                sent["stock"].push(ws);
                sent["bs_howmany"].push(hm);
                sent["pays_buy"].push(pb);
                sent["pays_how_m"].push(pbh);
                sent["bs"].push(bs);
                sent["state"].push(s);
            }else{
                const t = await Team.findById(offers[i].offerer);
                const ws = await Stock.findById(offers[i].what_stock);
                const hm = offers[i].how_many;
                const pb = (offers[i].payment_method == "money") ? "money" : await Stock.findById(offers[i].pbs);
                const pbh = offers[i].payment_amount;
                const bs = offers[i].bos;
                const s = offers[i].state;

                recived["offer_id"].push(offers[i]._id);
                recived["team"].push(t);
                recived["stock"].push(ws);
                recived["bs_howmany"].push(hm);
                recived["pays_buy"].push(pb);
                recived["pays_how_m"].push(pbh);
                recived["bs"].push(bs);
                recived["state"].push(s);
            }


        }

        

    

        res.render("management-panel.ejs", {"team": team, "user": req.session.user, "stocks": stocks, "team_stocks": team_stocks, "transactions": transes, "ts_names": stock_names, "ts_prices": stock_prices, "trs_names": trs_names, "trs_prices": trs_prices, "trs_users": trs_users, "tsq": total_stock_quantity, "net_value": net_value, "profit": profit, "teams": tms, "sent": sent, "recived": recived});
    }else{
        res.redirect("/login");
    }
});
app.get("/communication", async (req, res)=>{
    if(req.session.user){
        const notifs = await Notification.find().lean();
        const messages = await Reprots.find({
            user_id: req.session.user._id,
        }).lean();

        res.render("notifs-panel.ejs", {"user": req.session.user, "notifs": notifs, "messages": messages, "nagh": ""});
    }else{
        res.redirect("/login");
    }
});

app.get("/make-stock", (req, res)=>{
    if(req.session.user){
        res.render("mstock.ejs", {"user": req.session.user});
    }else{
        res.redirect("/login");
    }
});

app.get("/rankings", async (req, res)=>{
    if(req.session.user){
        const teams = await Team.find();
        let team_values = {};
        let last_i = 0;
        for(let i = 0; i < teams.length;i++){
            let value = 0;
            const team_stocks = await TeamStock.find({
                team_id: teams[i]._id
            });
            
            for(let j = 0;j < team_stocks.length;j++){
                const st = await Stocks.findById(team_stocks[j].stock_id);
                value += (team_stocks[j].quantity * st.price);
            }
            value += teams[i].net_worth;
            team_values[i] = {
                team: teams[i],
                value: value
            }
            last_i = i-1;
        }
        let temp;
        for(let i = 0; i <= last_i;i++){
            for(let j = 0;j <= last_i;j++){
                temp = team_values[i];
                if(team_values[i]['value'] > team_values[j]['value']){
                    team_values[i] = team_values[j]
                    team_values[j] = temp;
                }
            }
        }
        
        
        res.render("rankings.ejs", {"team_values": team_values, "rank": 1, "end": last_i});
    }else{
        res.redirect("/login");
    }
});

app.get("/signup", (req, res)=>{
    res.render("signup.ejs");
})
app.post("/make_account", upload.single("picture"), async (req, res)=>{
    console.log("m");
    const { team_name, first_mate, first_phone, second_mate, second_phone, third_mate, third_phone, school, clas} = req.body;


    console.log(`team: ${team_name}, firstmate: ${first_mate}->${first_phone}, secondmate: ${second_mate}->${second_phone}, thirdmate: ${third_mate}->${third_phone}, school: ${school}, class: ${clas}, color: nigger`);


    const signer = new signers({
        team_name: team_name,
        first_mate: first_mate,
        first_phone: first_phone,
        second_mate: second_mate,
        second_phone: second_phone,
        third_mate: third_mate,
        third_phone: third_phone,
        school: school,
        clas: clas,
        color: "nigger",
        pic: (req.file.filename) ?? "none found"
    });
    await signer.save();

    if(!req.file){
        console.log("no file detected");
    }

});


io.on("connection", (socket)=>{
    socket.on("make team", async ([name, color])=>{
        console.log(`color: ${color}, name: ${name}`);
        const team = new Team({
            name: name,
            color: color,
            users_id: []
        });

        await team.save();

        const npn = new pn({
            team_id: team._id,
            team_name: team.name
        });
        await npn.save();

        const teams = await Team.find().lean();
        io.emit("team made", teams); // j
    });
    socket.on("user added", async ([username, password, team_id])=>{
        const user = new User({
            username: username,
            password: password,
            team_id: new mongoose.Types.ObjectId(team_id),
            status: "user"
        });
        await user.save();
        const users = await User.find().lean();
        console.log(users);
    });

    socket.on("logout", ()=>{
        logout = false; 
    });

    socket.on("make stock", async ([name, price, number])=>{
        const stock = new Stocks({
            name: name,
            price: price,
            quantity: number,
            priceHistory: [Number(price)]
        });
        await stock.save();
        const stocks = await Stocks.find().lean();
        io.emit("stock made", stocks);
    });

    socket.on("uchanged", async (val) => {
        const stock = await Stocks.findById(val).lean();
        io.emit("ucfetch", stock);
    });

    socket.on("update stock", async ([id, name, price, number]) => {
        const s = await Stocks.findById(id);
        s.priceHistory.push(s.price);

        if(s.priceHistory.length > 29){
            let start = s.priceHistory.length - 29;
            s.priceHistory = s.priceHistory.slice(start, s.priceHistory.length)
        }

        const u = await Stocks.findByIdAndUpdate(id, {
            name: name,
            price: price,
            quantity: number,
            priceHistory: s.priceHistory
        })
        u.save();
        const stock_new = await Stocks.findById(id);
        io.emit("prices fetched", ([stock_new.priceHistory, stock_new.price]));

        const stocks = await Stocks.find().lean();
        io.emit("info for table", (stocks));
    });
    socket.on("remove team",async (team_id) => {

        const users = await User.find({
            team_id: team_id
        });

        for(let i = 0;i < users.length;i++){
            const tran = await Transaction.deleteMany({
                user_id: users[i]._id
            });
            const rep = await Reprots.deleteMany({
                user_id: users[i]._id
            });
        }

        const ur = await User.deleteMany({
            team_id: team_id
        });
        const r = await Team.findByIdAndDelete(team_id);
        const p = await pn.deleteOne({
            team_id: team_id
        });
    });
    socket.on("remove stock", async (stock_id)=>{
        const r = await Stocks.findByIdAndDelete(stock_id);
        const r2 = await TeamStock.deleteMany({
            stock_id: stock_id
        });
        const r3 = await Transactions.deleteMany({
            stock_id: stock_id
        });
    });

    /*
    1. check if the user's team has enough money to buy the goods
    2. check if there is enough stocks for the user to buy
    3. create a transaction for the user and the specified stock(S)
    4. change the price of each stock alongside it's free quantity
    5. change the teams value
    6. 
    */

    socket.on("stocks bought", async (ids, sum, s_prices, s_quantity, user_id)=>{
        let check_net_worth = false;
        let check_enough_stocks = true;

        const user = await User.findById(user_id);

        const team_id = user.team_id;
        const team = await Team.findById(team_id);
        

        if(team.net_worth >= sum) check_net_worth = true;

        for(let i = 0;i < ids.length;i++){
            const stock = await Stocks.findById(ids[i]);
            const requested = s_quantity[i];
            console.log(`stock: ${stock.name}, price: ${stock.price}, quantity: ${stock.quantity}, req: ${requested}`);

            if(stock.quantity < requested) check_enough_stocks = false;
        }
        if(check_net_worth && check_enough_stocks){
            for(let i = 0;i < ids.length;i++){
                const stock = await Stocks.findById(ids[i]).lean();
                const requested = s_quantity[i];
                const new_q = stock.quantity - requested;
                const delta = stock.quantity - new_q;
                const new_price = Math.round(stock.price + (stock.price * delta)/1000);
                console.log(`${stock.name} was ${stock.price} after changes it is ${new_price}`);
                console.log("===========================================");

                const tc = new Transactions({
                    stock_id: stock._id,
                    stock_name: stock.name,
                    stock_price: stock.price,
                    number: s_quantity[i],
                    user_id: user._id,
                    team_id: team._id,
                    operation: "buy"
                });
                await tc.save();



                stock.priceHistory.push(stock.price);

                if(stock.priceHistory.length > 29){
                    let start = stock.priceHistory.length - 29;
                    stock.priceHistory = stock.priceHistory.slice(start, stock.priceHistory.length)
                }

                console.log(stock.priceHistory.slice(0, 2));

                const u = await Stocks.findByIdAndUpdate(ids[i], {
                    price: new_price,
                    quantity: new_q,
                    priceHistory: stock.priceHistory
                });
                
                /*const p = await pn.updateOne({
                    team_id: team._id
                }, {
                    pn: team.net_worth
                });*/

                const t = await Team.findByIdAndUpdate(team._id, {
                    net_worth: team.net_worth - sum
                });

                const has_had_before = await TeamStock.findOne({
                    team_id: team._id,
                    stock_id: stock._id
                });
                if(has_had_before){
                    const uts = await TeamStock.findByIdAndUpdate(has_had_before._id, {
                        quantity: has_had_before.quantity + s_quantity[i]
                    });
                }else{
                    const ts = new TeamStock({
                        team_id: team._id,
                        stock_id: stock._id,
                        quantity: s_quantity[i]
                    });
                    await ts.save();
                }
                const team_user = await Team.findById(team._id);
                const team_stock_p = await TeamStock.find({
                    team_id: team._id
                });
                const pn_p = await pn.find({
                    team_id: team._id
                });
                

                socket.emit("SBFU", "سهام های درخواست شده خریداری شد");
                const stock_new = await Stocks.findById(ids[i]);
                io.emit("prices fetched", ([stock_new.priceHistory, stock_new.price]));
                

                let value = 0;
                for(let i = 0;i < team_stock_p.length;i++){
                    let s_p = await Stock.findById(team_stock_p[i].stock_id);
                    value += (team_stock_p[i].quantity * s_p.price);
                }
                console.log(`total_val: ${value + team_user.net_worth}, p: ${pn_p[0].pn}, tn: ${team_user.net_worth}`);
                let total_val = value + team_user.net_worth;
                let delta_p = total_val - pn_p[0].pn;
                let profit = (delta_p/pn_p[0].pn) * 100;

                io.emit("new profit", ([profit, team._id]));

                const stocks = await Stocks.find().lean();
                io.emit("info for table", (stocks));
            }
        }else{
            socket.emit("not enough C", "کاربر گرامی شما پول کافی را برای خرید این تعداد سهام ندارید.");
        }
    });
    socket.on("stocks sold", async ([ids, quantity, sums, user_id])=>{
        let net_worth_delta = 0;
        for(let i = 0;i < ids.length;i++){
            const stock = await Stock.findById(ids[i]);
            const sold_quantity = quantity[i];
            const sold_value = sums[i];
            const user = await User.findById(user_id);
            const team = await Team.findById(user.team_id);


            const check_if_has_quantity = await TeamStock.findOne(
                {
                    stock_id: stock._id,
                    team_id: team._id
                }
            );
            if(check_if_has_quantity && !(check_if_has_quantity.quantity >= sold_quantity)){
                socket.emit("UNES", "کاربر گرامی شما سهام کافی را برای فروش ندارید.");
                return;
            }

            /*
            const stock = await Stocks.findById(ids[i]).lean();
            const requested = s_quantity[i];
            const new_q = stock.quantity - requested;
            const delta = stock.quantity - new_q;
            const new_price = stock.price + (stock.price * delta)/100;
            console.log(`${stock.name} was ${stock.price} after changes it is ${new_price}`);
            */

            const t_stock = await TeamStock.find();
            if(!t_stock) return;
            let total_stock_q = stock.quantity;
            for(let i = 0;i < t_stock.length;i++){
                if(stock._id.toString() == t_stock[i].stock_id.toString()){
                    total_stock_q += t_stock[i].quantity;
                }
            }
            console.log("==================");
            console.log(`total quantity is ${total_stock_q}`);
            console.log("==================");

            const new_q = sold_quantity + Number(stock.quantity);
            const delta = new_q - Number(stock.quantity);
            let new_price = Math.round(stock.price - (stock.price * delta)/1000);
            console.log(`${stock.name} was valued at ${stock.price} and now it is ${new_price}`);
            console.log("\n");
            console.log(`the quantity was ${stock.quantity} and  now it is ${new_q}`)
            
            if(new_price <= 0){
                new_price = 1;
            }

            stock.priceHistory.push(stock.price);

            const previous_ts = await TeamStock.findOne({
                team_id: team._id,
                stock_id: stock._id
            });
            if(!previous_ts){
                return;
            }

            const make_transaction = new Transactions({
                stock_id: stock._id,
                stock_name: stock.name,
                stock_price: stock.price,
                number: sold_quantity,
                user_id: user._id,
                team_id: team._id,
                operation: "sold" 
            });
            await make_transaction.save();

            
            const team_stock_fetch = await TeamStock.updateOne({
                team_id: team._id,
                stock_id: stock._id,
            }, {
                quantity: (previous_ts.quantity - sold_quantity)
            });

            /*const update_pn = await pn.updateOne({
                team_id: team._id
            }, {
                pn: team.net_worth
            });*/
            
            const update_team = await Team.findByIdAndUpdate(team._id, {
                net_worth: (team.net_worth + (sold_quantity * stock.price))
            });

            if(stock.priceHistory.length > 29){
                let start = stock.priceHistory.length - 29;
                stock.priceHistory = stock.priceHistory.slice(start, stock.priceHistory.length)
            }
            

            const update_stock = await Stock.findByIdAndUpdate(ids[i], {
                price: new_price,
                quantity: new_q,
                priceHistory: stock.priceHistory
            });
            socket.emit("USS", "سهام های درخواست شده فروخته شد.");
            const stock_new = await Stocks.findById(ids[i]);
            io.emit("prices fetched", ([stock_new.priceHistory, stock_new.price]));
            
            const stocks = await Stocks.find().lean();
            io.emit("info for table", (stocks));


            const team_user = await Team.findById(team._id);
            const team_stock_p = await TeamStock.find({
                team_id: team._id
            });
            const pn_p = await pn.find({
                team_id: team._id
            });

            let value = 0;
            for(let i = 0;i < team_stock_p.length;i++){
                let s_p = await Stock.findById(team_stock_p[i].stock_id);
                value += (team_stock_p[i].quantity * s_p.price);
            }
            console.log(`total_val: ${value + team_user.net_worth}, p: ${pn_p[0].pn}, tn: ${team_user.net_worth}`);
            let total_val = value + team_user.net_worth;
            let delta_p = total_val - pn_p[0].pn;
            let profit = (delta_p/pn_p[0].pn) * 100;

            io.emit("new profit", ([profit, team._id]));

        }
    });
    socket.on("fetch prices", async (id)=>{
        const stock = await Stocks.findById(id);
        const prices = stock.priceHistory;
        socket.emit("prices fetched", ([prices, stock.price]));
    });
    socket.on("upload notif", async ([publisher, topic, txt, admin_id])=>{
        const a = await User.findOne({
            _id: admin_id
        });
        const notif = new Notification({
            topic: topic,
            text: txt,
            publisher_name: publisher,
            uploader_id: a._id,
            uploader_name: a.username 
        });
        await notif.save();
        socket.emit("notif uploaded", "پیام برای کاربران در پنل ارتباطات قرار گرفت.");

        const notifs = await Notification.find().lean();
        io.emit("notifs changed", (notifs));

    });
    socket.on("remove notif", async (id)=>{
        const r = await Notification.findByIdAndDelete(id);
        socket.emit("notif removed", "پیام حذف شد.");

        const notifs = await Notification.find().lean();
        io.emit("notifs changed", (notifs));
    });
    socket.on("new report", async ([new_report, user_id])=>{
        const user = await User.findById(user_id).lean();
        console.log(user);
        const admin = await User.find({
            status: "admin"
        }).lean();
        const nr = new Reprots({
            report: new_report,
            user_id: user._id,
            admin_id: admin[0]._id
        });
        await nr.save();
        const reports = await Reprots.find().lean();
        const users = [];

        for(let i = 0;i < reports.length;i++){
            const u = await User.findById(reports[i].user_id);
            users.push(u);
        }

        io.emit("report sent admin", ([reports, users]));
        socket.emit("report sent", "کاربر گرامی پیام شما به ادمین ها منتقل شده و در اصرع وقت بررسی میشود.");
    });
    socket.on("fetch report", async (id)=>{
        const reports = await Reprots.find({
            user_id: id
        }).lean();
        const u = await User.findById(id);
        console.log("b");
        socket.emit("reports fetched", ([reports, u]));
        console.log("e");
    });
    socket.on("make personal stock", async ([quantity, sname,user_id])=>{
        const price_for_each = process.env.PFES;
        const rm = (price_for_each * quantity);
        const user = await User.findById(user_id);
        const team = await Team.findById(user.team_id);
        if(team.net_worth >= rm){
            const stock = new Stocks({
            name: sname,
            price: price_for_each,
            quantity: 0,
            priceHistory: [0]
            }); 
            await stock.save();
            const team_stock = new TeamStock({
                team_id: team._id,
                stock_id: stock._id,
                quantity: quantity
            });
            await team_stock.save();

            const u = await Team.findByIdAndUpdate(team._id, {
                net_worth: (team.net_worth - rm)
            });

            socket.emit("personal stock made", "کاربر گرامی سهام برای شرکت شما ایجاد شد\nبرای اینکه گروه های دیگر بتوانند آنرا بخرند باید آنرا بفروشید");
        }else{
            socket.emit("not enough money mate");
        }
    });
    socket.on("admin sent answer", async ([answer, user_id])=>{
        
        let pussy = new Reprots({
            user_id: user_id,
            report: "boobool talai",
            answer: answer,
            admin_id: "68dd94f25cda0c30e6853199"
        });
        await pussy.save();

        const reports = await Reprots.find({
            user_id: user_id
        });

        io.emit("answers saved", (reports));
    });

    socket.on("new info", async ([user, names, infos])=>{
        try{
            const check = await Info.find({
                user_id: user
            }).lean();
            if(check.length == 0){
                const make_new_info = new Info({
                    user_id: user,
                    text: infos
                });
                make_new_info.save();
                socket.emit("info made");
            }else{
                socket.emit("info present");
            }
        }catch(Exception)
        {
            
        }

    });

    socket.on("sends an offer to buy", async ([from, to, buys, how_many, payment_method, quantity, pays_buy])=>{
        
        let f = how_many;
        let s = quantity;
        let mt = await Team.findById(from);
        if(payment_method == "money"){    
            if(!(mt.net_worth >= Number(s.replace(/,/g, "")))){
                socket.emit("you are broke")
                return;
            }
        }else{
            let fsh = await Stocks.findById(pays_buy).lean(); // the stock that he wants to pay by
            let tsh = await TeamStock.find({ // find the teamstock for this team-stock combo
                team_id: mt._id,
                stock_id: fsh._id
            });
            
            if(tsh){
                if(!(Number(tsh[0].quantity) >= Number(s.replace(/,/g, "")))){
                    socket.emit("doesn't have enough of stock");
                    return;
                }
            }else{
                socket.emit("you don't have this anyways");
                return;
            }
        }
        
        n = new offer({
            offerer: from,
            reciver: to,
            bos: "buy",
            what_stock: buys,
            how_many: Number(f.replace(/,/g, "")),
            payment_method: payment_method,
            pbs: (pays_buy != "money") ? pays_buy : null,
            payment_amount: Number(s.replace(/,/g, ""))
        });
        await n.save();
        socket.emit("offer to buy made");
    });
    socket.on("team_fu_changed", async (id)=>{
        let t = await Team.findById(id);
        socket.emit("team_fu_found", (t));
    });
    socket.on("update for team req", async ([id, color, net])=>{
        const u = await Team.findByIdAndUpdate(id, {
            color: color,
            net_worth: net
        });
        socket.emit("update for team done");
    });
    socket.on("wants to sell stock", async ([from, to, sells, sells_many, pbs, gets_many])=>{
        console.log(`from: ${from}, to: ${to}, sells: ${sells}, sells_many: ${sells_many}, pbs: ${pbs}, gets_many: ${gets_many}`);
        const o = new offer({
            offerer: from,
            reciver: to,
            bos: "sell",
            what_stock: sells,
            how_many: sells_many,
            payment_method: (pbs == "money") ? "money" : "stocks",
            payment_amount: Number(gets_many.replace(/,/g, "")),
            pbs: (pbs != "money") ? pbs : null
        });
        await o.save();
        socket.emit("sell offer sent");
    });
    socket.on("offer accepted", async (id)=>{
        let o = await offer.findById(id);
        let offerer = await Team.findById(o.offerer);
        let reciver = await Team.findById(o.reciver);
        if(o.bos == "buy"){
            let target_team = await Team.findById(o.reciver);
            let target_team_stocks = await TeamStock.findOne({
                team_id: target_team._id,
                stock_id: o.what_stock
            }).lean();
            if(target_team_stocks && target_team_stocks.quantity >= o.how_many){
                let take_from_reciver = await TeamStock.updateOne({
                    stock_id: o.what_stock,
                    team_id: target_team._id
                }, {
                    quantity: (target_team_stocks.quantity - o.how_many)
                });
                let offerer_has_stock = await TeamStock.findOne({
                    team_id: o.offerer,
                    stock_id: o.what_stock 
                }).lean();
                if(offerer_has_stock){
                    let give_to_offerer = await TeamStock.findByIdAndUpdate(offerer_has_stock._id, {
                        quantity: (offerer_has_stock.quantity + o.how_many)
                    });
                    if(o.payment_method == "stocks"){
                        let osh = await TeamStock.findOne({
                            team_id: o.offerer,
                            stock_id: o.pbs
                        }).lean();
                        let take_from_offerer = await TeamStock.findByIdAndUpdate(osh._id, {
                            quantity: (osh.quantity - o.payment_amount)
                        });
                        let rhs = await TeamStock.findOne({
                            team_id: o.reciver,
                            stock_id: o.pbs
                        });
                        if(rhs){
                            let give_to_reciver = await TeamStock.findByIdAndUpdate(rhs._id,{   
                                quantity: (rhs.quantity + o.payment_amount)
                            });
                        }else{
                            let give_to_reciver = new TeamStock({
                                team_id: o.reciver,
                                stock_id: o.pbs,
                                quantity: o.payment_amount
                            });
                            await give_to_reciver.save();
                        }
                    }else{
                        let take_from_offerer = await Team.findByIdAndUpdate(offerer._id, {
                            net_worth: (offerer.net_worth - o.payment_amount)
                        });
                        let give_to_reciver = await Team.findByIdAndUpdate(reciver._id, {
                            net_worth: (reciver.net_worth + o.payment_amount)
                        });
                    }
                }else{
                    let give_to_offerer = new TeamStock({
                        team_id: o.offerer,
                        stock_id: o.what_stock,
                        quantity: o.how_many
                    });
                    await give_to_offerer.save();
                    let rs = await TeamStock.findOne({
                        team_id: o.reciver,
                        stock_id: o.what_stock
                    });
                    let take_from_reciver = await TeamStock.findByIdAndUpdate(rs._id, {
                        quantity: (rs.quantity - o.how_many)
                    });
                    if(o.payment_method == "stocks"){
                        let ohs = await TeamStock.findOne({
                            team_id: o.offerer,
                            stock_id: o.pbs
                        });
                        let take_from_offerer = await TeamStock.findByIdAndUpdate(ohs._id, {
                            quantity: (ohs.quantity - o.payment_amount)
                        });
                        let rhs = await TeamStock.findOne({
                            team_id: o.reciver,
                            stock_id: o.pbs
                        }).lean();
                        if(rhs){
                            let give_to_reciver = await TeamStock.findByIdAndUpdate(rhs._id, {
                                quantity: (rhs.quantity + o.payment_amount)
                            });
                        }else{
                            let give_to_reciver = new TeamStock({
                                team_id: o.reciver,
                                stock_id: o.pbs,
                                quantity: o.payment_amount
                            });
                            await give_to_reciver.save();
                        }
                    }else{
                        let take_from_offerer = await Team.findByIdAndUpdate(offerer._id, {
                            net_worth: (offerer.net_worth - o.payment_amount)
                        });
                        let give_to_reciver = await Team.findByIdAndUpdate(reciver._id, {
                            net_worth: (reciver.quantity + o.payment_amount)
                        });
                    }
                    
                    
                }
                let d = await offer.findByIdAndDelete(o._id);
            }else{
                console.log("impossible");
            }
        }else{
            let ohs = await TeamStock.findOne({
                team_id: o.offerer,
                stock_id: o.what_stock
            });
            if(!ohs || ohs.quantity < o.how_many){
                console.log("offerer lied");
                return;
            }
            let rhs = await TeamStock.findOne({
                team_id: o.reciver,
                stock_id: o.pbs
            });
            if(o.payment_method == "stocks" && (!rhs || rhs.quantity < o.payment_amount)){
                console.log("reciver lied");
                return;
            }
            if(o.payment_method == "money" && o.payment_amount > reciver.net_worth){
                console.log("reciver lied(no money)");
                return;
            }

            let take_from_offerer = await TeamStock.updateOne({
                team_id: o.offerer,
                stock_id: o.what_stock
            }, {
                quantity: (ohs.quantity - o.how_many)
            });

            let rsfg = await TeamStock.findOne({
                team_id: o.reciver,
                stock_id: o.what_stock
            }).lean();

            if(rsfg){
                let give_to_reciver = await TeamStock.findByIdAndUpdate(rsfg._id, {
                    quantity: (rsfg.quantity + o.how_many)
                });
            }else{
                let give_to_reciver = new TeamStock({
                    team_id: o.reciver,
                    stock_id: o.what_stock,
                    quantity: o.how_many
                });
                await give_to_reciver.save();
            }

            if(o.payment_method == "stocks"){
                let saww = await TeamStock.findOne({
                    team_id: o.offerer,
                    stock_id: o.pbs
                });
                if(saww){
                    let give_to_offerer = await TeamStock.findByIdAndUpdate(saww._id, {
                        quantity: (saww.quantity + o.payment_amount)
                    });
                }else{
                    let give_to_offerer = new TeamStock({
                        team_id: o.offerer,
                        stock_id: o.pbs,
                        quantity: o.payment_amount
                    });
                    await give_to_offerer.save();
                }
                let take_from_reciver = await TeamStock.findByIdAndUpdate(rhs._id, {
                    quantity: (rhs.quantity - o.payment_amount)
                });
            }else{
                let give_to_offerer = await Team.findByIdAndUpdate(offerer._id, {
                    net_worth: (offerer.net_worth + o.payment_amount)
                });
                let take_from_reciver = await Team.findByIdAndUpdate(reciver._id, {
                    net_worth: (reciver.net_worth - o.payment_amount)
                });
            }
            let d = await offer.findByIdAndDelete(o._id);
        }
    });
    socket.on("team accepted", async (id)=>{
        let u = await offer.findByIdAndUpdate(id, {
            state: true
        });
        let o = await offer.findById(id).lean();
        console.log(`o: ${o.offerer}, r: ${o.reciver}`);
        io.emit("team accepted announcment", ([o.offerer, o.reciver]));
    });
    socket.on("offer declined", async (id)=>{
        let o = await offer.findById(id);
        let u = await offer.findByIdAndDelete(id);
        
        io.emit("offer declined announcment", ([o.offerer, o.reciver]));
    });

});





server.listen(port, ()=>{
    console.log(`server running on port ${port}`);
});