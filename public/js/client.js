const socket = io();
let chart;

$(document).ready(()=>{
    $(document).on("click", "#maketeam", function(e){
        if($("#name").val() != "" && $("#color").val() != ""){
            socket.emit("make team", ([$("#name").val(), $("#color").val()]));
            socket.on("team made", teams => {
                let html = "";
                for(let i = 0;i < teams.length;i++){
                    html += `<option value'${teams[i]._id}'>${teams[i].name}</option>`;
                }
                $("#team_select").html(html);
            });
            alert("تیم ایجاد شد.");
            $("#name").val("");
            $("#color").val("");
            window.location.reload();
        }else{
            alert("لطفا تمامی فیلد هارا پر کنید.");
        }
    });

    $(document).on("click", "#add_user", function(){
        if($("#username").val() != "" && $("#password").val() != ""){
            socket.emit("user added", ([$("#username").val(), $("#password").val(), $("#team_select").val()]));
            alert("کاربر ایجاد و به تیم اضافه شد.");
            $("#username").val("");
            $("#password").val("");
        }else{
            alert("لطفا تمامی فیلد هارا پر کنید.");
        }
    });

    $(document).on("click", "#logout", function(){
        socket.emit("logout");
    });

    $(document).on("keyup", "#price", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $("#tprice").val(val);
            $(this).val(val.toLocaleString());
        }else{
            $(this).val(0);
            $("#tprice").val(0);
            alert("لطفا تنها اعداد را در این فیلد وارد کنید.");
        }
    })

    $(document).on("click", "#make_stock", function(){
        if($("#stock_name").val() != "" && $("#price").val() != "" && $("#tnumber").val() != ""){
            socket.emit("make stock", ([$("#stock_name").val(), $("#tprice").val(), $("#tnumber").val()]));
            
            socket.on("stock made", (stocks)=>{
                let html = "";
                for(let i = 0;i < stocks.length;i++){
                    html += "<option value='" + stocks[i]._id + "'>" + stocks[i].name + "</option>"
                }
                $("#ustockn").html(html);
            })
            
            alert("استاک ایجاد شد . اکنون تیم ها میتوانند انرا بخرند");
            $("#stock_name").val("");
            $("#price").val("");
            $("#tprice").val("");
            $("#number").val("");
        }else{
            alert("لطفا تمامی فیلد هارا پر کنید.");
        }
    });

    $(document).on("click", "#update_stock", function(){
        if($("#ustock_name").val() != "" && $("#uprice").val() != "" && $("#unumber").val() != ""){
            socket.emit("update stock", ([$("#ustockn").val(), $("#ustock_name").val(), $("#utprice").val(), $("#utnumber").val()]));
            window.location.reload();
        }else{
            alert("لطفا تمامی فیلد هارا پر کنید.");
        }
    });

    $(document).on("change", "#ustockn", function(){
        socket.emit("uchanged", $(this).val());
        socket.on("ucfetch", s => {
            $("#ustock_name").val(s.name);
            $("#uprice").val(Number(s.price).toLocaleString());
            $("#unumber").val(Number(s.quantity).toLocaleString());
            $("#utnumber").val(s.quantity);
            $("#utprice").val(s.price)
        });
    });

    $(document).on("keyup", "#number", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $("#tnumber").val(val);
            $(this).val(val.toLocaleString());
        }else{
            alert("لطفا تنها اعداد طبیعی را در این فیلد وارد کنید.");
            $(this).val("");
            $("#tnumber").val("");
        }
    });
    $(document).on("keyup", "#unumber", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
            $("#utnumber").val(val);
        }else{
            alert("لطفا تنها اعداد طبیعی را در این فیلد وارد کنید.");
            $(this).val("");
            $("#utnumber").val("");
        }

    });
    
    $(document).on("keyup", "#uprice", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
            $("#utprice").val(val);
        }else{
            $(this).val("");
            ("#utprice").val("");
            alert("لطفا در این فیلد تنها اعداد طبیعی را وارد کنید.");
        }
    });
    $(document).on("click", "#remove_team", function(){
        socket.emit("remove team", $("#rts").val());
        window.location.reload();
    });
    $(document).on("click", "#remove_stock", function(){
        socket.emit("remove stock", ($("#rss").val()));
        socket.on("sr", ()=>{
            if(window.location == "https://nasiric.onrender.com/admin/panel"){
                alert("سهام حذف شد.");
            }
        });
        window.location.reload();
    });
    $(document).on("keyup", ".required_q", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            let bp = Number($(`#base-price${$(this).attr("i")}`).html().replace(/,/g, ""));
            let all = ((bp*val).toLocaleString());
            $(`#price${$(this).attr("i")}`).html(all.toString());
            $(this).val(val.toLocaleString());
            $(`#tq${$(this).attr("i")}`).val(val);
        }else{
            alert("لطفا در این فیلد تنها اعداد طبیعی را وارد کنید");
            $(this).val("");
            $(`#tq${$(this).attr("i")}`).val("");
        }
    });

    /*
    1. check if the user's team has enough money to buy the goods
    2. check if there is enough stocks for the user to buy
    3. create a transaction for the user and the specified stock(S)
    4. change the price of each stock alongside it's free quantity
    5. change the teams value
    6. 
    */

    $(document).on("click", "#buy", function(){

        if(!confirm("آیا مطمعا هستید که میخواهید این خرید را انجام دهید؟")){
            return;
        }

        let sum = 0;
        let ids = [];
        let s_prices = [];
        let s_quantity = [];
        let exists = false;

        for(let i = 0;i < 50;i++){
            if($(`#price${i}`).length > 0){
                if(Number($(`#price${i}`).html().replace(/,/g, "")) != 0){
                    sum += Number($(`#price${i}`).html().replace(/,/g, ""));
                    //alert($(`#price${i}`).attr("pid"));
                    ids.push($(`#price${i}`).attr("pid"));
                    s_prices.push(Number($(`#price${i}`).html().replace(/,/g, "")));
                    s_quantity.push(Number($(`#tq${i}`).val().replace(/,/g, "")));
                    exists = true;
                }
            }
        }
        if(exists) socket.emit("stocks bought", ids, sum, s_prices, s_quantity, $("#user").attr("content"));
    });
    
    $(document).on("keyup", ".current-supply", function(){    
        let total_q = 0;
        let total_p = 0;
        for(let i = 0;i < 50;i++){
            if($(`#price${i}`).length > 0 ){
                current_price = Number($(`#price${i}`).html().replace(/,/g, ""));
                current_quantity = Number($(`#tq${i}`).val());
                
                total_q += current_quantity;
                total_p += current_price;
            }
        }
        
        $("#pricet").html(total_p.toLocaleString());
        $("#dqt").html(total_q.toLocaleString());
    });

    $(document).on("click", "#sell", function(){
        let ids = [];
        let quantity = [];
        let sums = [];
        let exists = false;

        for(let i = 0;i < 50;i++){
            if($(`#base-price${i}`).length > 0){
                if(Number($(`#tq${i}`).val()) != 0){
                    ids.push($(`#price${i}`).attr("pid"));
                    quantity.push(Number($(`#tq${i}`).val().replace(/,/g, "")));
                    sums.push(Number($(`#price${i}`).html().replace(/,/g, "")));
                    exists = true;
                }
                /*
                ids.push($(`price${i}`).attr("pid"));
                quantity.push(Number($(`#tq${i}`).val().replace(/,/g, "")));
                sums.push(Number($(`price${i}`).html().replace(/,/g, "")));
                */
            }
        }
        if(exists){
            if(!confirm("آیا مطمعا هستید که میخواهید این سهام ها را بفروشید؟")) return;
            socket.emit("stocks sold", ([ids, quantity, sums, $("#user").attr("content")]));
        }
    });
    socket.on("not enough C", (msg)=>{
        alert(msg);
        window.location.reload();
    });
    socket.on("SBFU", (msg)=>{
        alert(msg);
        window.location.reload();
    });
    socket.on("UNES", (msg)=>{
        alert(msg);
        window.location.reload();
    });
    socket.on("USS", (msg)=>{
        alert(msg);
        window.location.reload();
    });
    socket.on("new profit", ([profit, team_id])=>{
        
        if($("#ti").attr("content") == String(team_id)){
            let audio = new Audio("notif.mp3");
            audio.play();
            $("#profit_goes_here").html(profit.toLocaleString() + "%");
        }
    });
    $(document).on("change", "#display_stocks", function(){
        let id = $(this).val();
        socket.emit("fetch prices", id);
    });
    socket.on("prices fetched", ([prices, current_price, s, rest])=>{
            let html = "";
            for(let i =0;i < prices.length;i++){
                html += `<div style='position: absolute;bottom: 0;left: ${i * 20 + 5}px;width: 10px;background-color:${(prices[i] > prices[i - 1]) ? "Green" : "Red"};height: ${prices[i]/800}px;' title='${Number(prices[i]).toLocaleString()}'></div>`;
            }
            html += `<div style='position: absolute;bottom: 0;left: ${prices.length * 20 + 5}px;width: 10px;background-color:${(current_price > prices[prices.length-1]) ? "Green" : "Red"};height: ${current_price/800}px;' title='${Number(current_price).toLocaleString()}'></div>`
            
            prices.push(current_price)
            chart.data.datasets[0].data = prices;
            chart.update();

            let fs = `<option value='${s._id}'>${s.name}</option>`;
            for(let i = 0;i < rest.length;i++){
                fs += `<option value='${rest[i]._id}'>${rest[i].name}</option>`;
            }
            $("#display_stocks").html(fs);
            

            $("#chart").html(html);
    });
    socket.on("info for table", (stocks)=>{
        
        let html = "";
        for(let i = 0;i < stocks.length;i++){
            html += `<tr><td class="item-name" style="padding: 8px;">${stocks[i].name}></td><td class="price" style="padding: 8px;">${stocks[i].price.toLocaleString()}</td><td class="price" style="padding: 8px;">${stocks[i].priceHistory[stocks[i].priceHistory.length-1].toLocaleString()}</td><td style="padding: 8px;color: ${(stocks[i].price >= stocks[i].priceHistory[stocks[i].priceHistory.length - 1]) ? 'Green' : 'Red'};"><strong>${((stocks[i].price - stocks[i].priceHistory[stocks[i].priceHistory.length - 1])/(stocks[i].priceHistory[stocks[i].priceHistory.length - 1]))*100}</strong></td></tr>`
        }
        //$("#lastUpdate").html(`آخرین بروزرسانی: ${Date.now()}`);
        $("#table-body").html(html);
    });
    $(document).on("click", "#add_news", function(){
        socket.emit("upload notif", ([$("#publisher").val(), $("#topic").val(), $("#text").val(), $("#user").attr("content")]));
        socket.on("notif uploaded", (message)=>{
            alert(message);
            window.location.reload();
        })
    });
    $(document).on("click", ".remove_n", function(){
        socket.emit("remove notif", $(this).attr("nid"));
        socket.on("notif removed", (txt)=>{
            alert(txt);
        })
    });
    
    socket.on("notifs changed", (notifs)=>{
        if(window.location == "https://nasiric.onrender.com/communication"){
            let html = "";
            for(let i = 0;i < notifs.length;i++){
                html += `<div class="post">
                            <div class="post-header" style="float: right;">
                                <div class="post-user-info"">
                                    <div class="username">${notifs[i].publisher_name}</div>
                                </div>
                                <div class="avatar">${notifs[i].uploader_name[0]}</div>
                            </div>
                            <div class="col-lg-12"></div>
                            <div class="post-content" style="float: right;">
                                <div class="post-text">${notifs[i].text}</div>
                            </div>
                        </div>`;
            }
            let html2 = "";
            for(let i = 0;i < notifs.length;i++){
                html2 += `<div></div>`;
            }
            let audio = new Audio("notif.mp3");
            audio.play();
            $("#postsFeed").html(html);
        }else if(window.location == "https://nasiric.onrender.com/"){
            let number = 0;
            for(let i = 0;i < notifs.length;i++){
                number++;
            }
            $("#non").html(number);
            let audio = new Audio("notif.mp3");
            audio.play();
        }
        
    });
    $(document).on("click", "#sendMessage", function(){
        if($("#postInput").val() != ""){
            socket.emit("new report", ([$("#postInput").val(), $("#user").attr("content")]));
            socket.on("report sent", (messages)=>{
                let html = "";
                let lastMessage = "";
                for(let i = 0;i < messages.length;i++){
                    if(messages[i].report != "boobool talai"){
                        html += `<div class='message sent'>${messages[i].report}</div>`;
                    }else{
                        html += `<div class='message received' style='background-color: olive;'>${messages[i].answer}</div>`
                    }
                }

                for(let i = 0;i < messages.length;i++){
                    if(messages[i].report == "boobool talai"){
                        lastMessage = messages[i].answer;
                    }else{
                        lastMessage = messages[i].report;
                    }
                }

                $("#chatMessages").html(html);
                $(".chat-preview").html(lastMessage);
                $("#postInput").val("");
            })
        }
    });
    $(document).on("click", ".speak", function(){
        socket.emit("fetch report", $(this).attr("rid"));
        socket.on("reports fetched", ([reports, user])=>{
            let html = "<div class='col-lg-12' id='close'>خروج</div>";
            for(let i = 0;i < reports.length;i++){
                html += `<div style='width: 100%;background-color: whitesmoke'>${user.username}: ${reports[i].report}</div><br><br>`;
            }
            html += `<div class='col-lg-12'><textarea name='admin_a' id='admin_a' class='form-control'></textarea><br><br><button type='button' uid='${user._id}' id='answer' class='btn btn-primary'>ارسال جواب</button></div>`;
            $("#conv").html(html);
            $("#conv").css("display", "block");
        });
    });
    let pleasehelpme = 
    $(document).on("click", "#answer", function(){
        let answer = $("#admin_a").val();
        pleasehelpme = $(this).attr("uid");
        socket.emit("admin sent answer", ([answer, pleasehelpme]));
    });
    socket.on("answers saved", (reports)=>{     
            if($("#uid_n").attr("content") == reports[0].user_id){
                let html = "";
                for(let i = 0;i < reports.length;i++){
                    if(reports[i].report == "boobool talai"){
                        html += `<div class='message received' style='background-color: olive;'>${reports[i].answer}</div>`
                    }else{
                        html += `<div class='message sent'>${reports[i].report}</div>`
                    }
                }
                $("#chatMessages").html(html);
                $(".chat-preview").html((reports[reports.length-1].report == "boobool talai") ? reports[reports.length-1].answer : reports[reports.length-1].report);
                let audio = new Audio("notif.mp3");
                audio.play();
            }
        });
    socket.on("report sent admin", ([reports, users])=>{
        if(window.location == "https://nasiric.onrender.com/admin/panel"){
            let html = "";
            for(let i = 0;i < reports.length;i++){
                html += `<tr><td>${users[i].username}</td><td>${reports[i].report}</td><td><div class="btn btn-success speak" rid="${reports[i]._id}"><div class="fa fa-plus"></div></div></td></tr>`;
            }
            const audio = new Audio("/notif.mp3");
            console.log(audio.currentTime);
            audio.play();
            
            $("#reports_here").html(html);
        }
        if(window.location == "https://nasiric.onrender.com/communication"){
            for(let i = 0;i < users.length;i++){
                let last_text = "";
                if(users[i]._id == $("#user").attr("content")){
                    last_text = reports[i].report;
                }
                $(".chat-preview").html(last_text);
            }
        }
    });
    $(document).on("click", "#close", function(){
        $("#conv").css("display", "none");
        $("#conv").html("");
    });
    $(document).on("keyup", "#quantity", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        console.log(val);
        if(!isNaN(val)){
            $("#tq").val(val);

            $("#price").html((val * 500).toLocaleString());

            val = val.toLocaleString();
            $(this).val(val);
        }else{
            alert("لطفا تنها اعداد صحیح را وارد کنید.");
        }
    });
    $(document).on("click", "#make_personal_stock", function(){
        socket.emit("make personal stock", ([$("#tq").val(), $("#name").val(), $("#user").attr("content")]));
        socket.on("personal stock made", (msg)=>{
            alert(msg);
            window.location.reload();
        });
        socket.on("not enough money mate", ()=>{
            alert("پول کافی نداری بدبخت");
        })
    });

    $(document).on("keyup", ".phone-number", function(){
        
    });

    $(document).on("click", "#chatWithAdmin", function(){
        $("#chatModal").css("display", "block");
    });
    $(document).on("click", "#close_chat", function(){
        $("#chatModal").css("display", "none");
    });
    $(document).on("click", "#submit-info", function(){
        const names = ["A", "B", "C"];
        const infos = [$("#info-a").val(), $("#info-b").val(), $("#info-c").val()];
        socket.emit("new info", ([$("#uid_n").attr("content"), names, infos]));
        socket.on("info made", ()=>{
            alert("اطلاعات شما به ادمین منعقد شد.");
        });
        socket.on("info present", ()=>{
            alert("شما قبلا اطلاعات خود را به ادمین فرستاده اید.");
        })
    });
    $(document).on("change", "#payment_method", function(){
        if($(this).val() == "money"){
            $("#what_stock").css("display", "none");
            $(this).attr("class", "col-lg-8 form-control");
        }else{
            $("#what_stock").css("display", "block");
            $(this).attr("col-lg-4");
        }
    });

    $(document).on("keyup", "#quantity_of_stock", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
        }else{
            alert("لطفا تنها اعداد صحیح را در این فیلد وارد کنید.");
            $(this).val(0);
        }
    });
    $(document).on("keyup", "#payment_quantity", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
        }else{
            alert("لطفا تنها اعداد صحیح را در این فیلد وارد کنید.");
            $(this).val(0);
        }
    });
    $(document).on("click", "#buy_it", function(){
        let to = $("#to_team").val();
        let from = $("#ti").attr("content");
        let buys = $("#stock_id").val();
        let how_many = $("#quantity_of_stock").val();
        let payment_method = ($("#payment_method").val() == "money") ? "money" : "stocks";
        let quantity = "";
        let pays_buy = "";
        if(payment_method == "stocks"){
            pays_buy = $("#with_this_stock").val();
            quantity = $("#payment_quantity").val();
        }else{
            pays_buy = "money";
            quantity = $("#payment_quantity").val();
        }
        
        socket.emit("sends an offer to buy", ([from, to, buys, how_many, payment_method, quantity, pays_buy]));
        socket.on("offer to buy made", ()=>{
            alert("درخواست شما برای تیم مقابل ارسال شد.");
            window.location.reload();
        })
    });
    $(document).on("change", "#team_for_update_here", function(){
        let id = $(this).val();
        socket.emit("team_fu_changed", (id));
        socket.on("team_fu_found", (t)=>{
            $("#update_color_here").val(t.color);
            $("#net_worth_update_here").val(Number(t.net_worth).toLocaleString());
        });
    });
    $(document).on("click", "#update_team", function(){
        let id = $("#team_for_update_here").val();
        let color = $("#update_color_here").val();
        let net_worth = Number($("#net_worth_update_here").val().replace(/,/g, ""));
        socket.emit("update for team req", ([id, color, net_worth]));
        socket.on("update for team done", ()=>{
            alert("تیم مورد نظر بروزرسانی شد.");
            window.location.replace();
        })
    });
    $(document).on("click", "#b", function(){
        $("#buy_sec").css("display", "block");
        $("#sell_sec").css("display", "none");
    });

    $(document).on("click", "#s", function(){
        $("#buy_sec").css("display", "none");
        $("#sell_sec").css("display", "block");
    });

    $(document).on("keyup", "#how_many_sells", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
        }else{
            alert("لطفا تنها اعداد صحیح را در این فیلد وارد کنید.");
            $(this).val(0);
        }
    });
    $(document).on("change", "#sells_by", function(){
        if($(this).val() == "money"){
            $("#gets_stock").css("display", "none");
        }else{
            $("#gets_stock").css("display", "block");
        }
    });
    socket.on("you are broke", ()=>{
        alert("کاربر گرامی شما به اندازه کافی پول ندارید.");
        window.location.replace();
    });
    socket.on("you don't have this anyway", ()=>{
        alert("کاربر گرامی شما این سهام را ندارید");
    });
    socket.on("doesn't have enough of stock", ()=>{
        alert("کاربر گرامی شما تعداد کافی از این سهام را ندارید.");
    });

    $(document).on("click", "#sells", function(){
        let from = $("#ti").attr("content");
        let to = $("#to_team").val();
        let sells = $("#sells_what").val();
        let sells_many = $("#how_many_sells").val();
        let pbs = ($("#sells_by").val() == "money") ?  "money" : $("#gets_stock").val();
        let gets_many = $("#gets_how_many").val();
        socket.emit("wants to sell stock", ([from, to, sells, sells_many, pbs, gets_many]));
        alert("درخواست شما ثبت گردید.");
        window.location.reload();
    });
    $(document).on("click", "#gets_how_many", function(){
        let val = Number($(this).val().replace(/,/g, ""));
        if(!isNaN(val)){
            $(this).val(val.toLocaleString());
        }else{
            alert("در این فیلد تنها اعداد صحیح را وارد کنید.");
            $(this).val(0)
        }
    })
    socket.on("wants to sell stock", ()=>{
        alert("درخواست شما ارسال گردید.");
    });

    $(document).on("click", ".accept_o", function(){
        if(confirm("آیا مطمعا هستید که میخواهید این درخواست را قبول کنید؟")){
            // socket.emit("offer accepted", ($(this).attr("id")));
            socket.emit("team accepted", ($(this).attr("id")));
        }
    });
    socket.on("team accepted announcment", ([offerer, reciver])=>{
        if(String($("#ti").attr("content")) == String(offerer) || String($("#ti").attr("content")) == String(reciver)){
            alert("کاربر گرامی یکی از درخواست ها قبول شده است.");
            let audio = new Audio("notif.mp3");
            audio.play();
        }
    });
    $(document).on("click", ".decline_o", function(){
        
        socket.emit("offer declined", ($(this).attr("id")));
    });
    socket.on("offer declined announcment", ([offerer, reciver])=>{
        if(String($("#ti").attr("content")) == String(offerer) || String($("#ti").attr("content")) == String(reciver)){
            alert("کاربر گرامی یکی از درخواست ها رد شده است.");
            let audio = new Audio("notif.mp3");
            audio.play();
        }
    });
    $(document).on("click", ".conf", function(){
        socket.emit("offer accepted", ($(this).attr("id")));
    });
    $(document).on("click", "#make_account", function(){

        

        var form = $("#registerForm")[0];
        var data = new FormData(form);

        
        if(!(String($("#first_phone").val()).length == 11 && String($("#second_phone").val()).length == 11 && String($("#third_phone").val()).length == 11)){
            alert("لطفا تمامی شماره تلفن هارا به درستی وارد کنید.\nمطمعا شوید که هیچ فاصله ای میان ارقام و یا در انتها و ابتدا  موجود نیست");
            return;
        }
        
        
        alert("لطفا تا دریافت پیام اعلام نتیجه از سایت خارج نشوید.(این ممکن است کمی طول بکشد!)");
        $("#first_phone").val("");
        $("#second_phone").val("");
        $("#third_phone").val("");
        $("#team_name").val("")
        $.ajax({
            type: "post",
            url: "/make_account",
            data: data,
            contentType: false,
            processData: false,
            success: function(data){
                alert(data);
            },
            error: function(){
                alert("با عرض پوزش در ارسال این اطلاعات با مشکلی مواجه شدیم\nلطفا دوباره تلاش کنید.\nدر صورت ادامه مشکل به شماره 0930 355 6126 در واتساپ یا ایتا پیام دهید");
            }
        });
        
    });
    socket.on("no more space", ()=>{
        if(window.location == "https://nasiric.onrender.com/signup"){
            alert("کاربر گرامی, با عرض پوزش تمامی 16 تیم مورد نیاز برای مسابقه انتخاب شده اند, در صورت پرداخت وجه پس از تکمیل 16 تیم لطفا فیش واریزی را به شماره'0930 355 6126' ارسال کرده تا وجه خود را پس بگیرید.");

        }
    });


    if(window.location == "http://127.0.0.1:8080/"){
        socket.emit("get the prices");
        socket.on("got the prices", (stock)=>{
            stock.priceHistory.push(stock.price);
            chart = new Chart(document.getElementById("canv").getContext("2d"), {
    type: "line",
    data: {
        labels: stock.priceHistory.map((v, i) => (i+1)),   
        datasets: [{
            label: "Price",
            data: stock.priceHistory.map(Number),
            borderWidth: 3,
            borderColor: "black",      
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
        });
    }

    $(document).on("click", "#fi", function(){
        socket.emit("change the finalee", ($(this).html()));
    });
    $(document).on("click", "#brf", function(){
        socket.emit("change the brf", $(this).html());
    });
    $(document).on("click", "#grf", function(){
        socket.emit("change the grf", $(this).html());
    });

    $(document).on("click", ".dec", function(){
        socket.emit("decline this offer A", ($(this).attr("id")));
        socket.on("offer deline worked", ()=>{
            alert("درخواست با موفقیت حذف شد.");
        });
    });

    let c;
    $(document).on("change", "#sfp", function(){
        let id = $(this).val();
        c = id;
        socket.emit("fetch the data for the new thing", (id));
        socket.on("got it now", (s)=>{
            $("#howmuchnow").html(`price: ${Number(s.price).toLocaleString()}`);
        });
    });

    $(document).on("click", "#increase", function(){
        let amount = $("#percent").val();
        if(amount < 0){
            if(Math.abs(amount) <= 0 || Math.abs(amount) >= 100){
                alert("لطفا مقادیر را به درستی وارد کنید.");
                return;
            }
            socket.emit("reduce by percentage", ([amount, $("#sfp").val()]));
            socket.on("updated the price", (price)=>{
                $("#howmuchnow").html(`price: ${price.toLocaleString()}`);
                alert("قیمت آپدیت شد.");
            });
        }else{
            socket.emit("increase by percentage", ([amount, $("#sfp").val()]));
            socket.on("update the price I", (price)=>{
                $("#howmuchnow").html(`price: ${price.toLocaleString()}`);
                alert("قیمت آپدیت شد.");
            });
        }
    });
    $(document).on("click", "#dr", function(){
        socket.emit("dr", ($(this).html()));
    });
    $(document).on("click", "#rp", function(){
        socket.emit("rp", ($(this).html()));
    });
});

