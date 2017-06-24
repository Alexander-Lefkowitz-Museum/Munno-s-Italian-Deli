//Alexander Lefkowitz :: 7-24-2013
_self = window;
var deli = {
    init:function () {
        var self = this;
        self.data.root = self;
        self.setValues();
        self.events();
        self.data.getMenuData();
        self.setMenuItems();
        self.integrations();
    },
    flags:{
        gotJSON:0,
        passwordValid:0,
        currentMenu:0,
        working:0,
        editing:0,
        editingMenu:0,
        maxIndex:0
    },
    shiftMenu: function () {
        var self = this
    },
    setValues: function (instance) {
        var self = this, n=0;

        self.$menus =       $("#rightSection .menu");
        self.rightSection   = document.getElementById("rightSection");
        self.ulTabs         = self.rightSection.getElementsByClassName("tabs")[0]
        self.buttons        = document.getElementById("adminPanel").getElementsByTagName("button");
        self.menuContainer  = document.getElementsByClassName("menuContainer")[0];
        
    },
    $menu:function () {
        this.$menus = $("#rightSection .menu");
        return this.$menus;
    },
    events:function () {
        var self = this, tabIndex, index, $holdMenu, holdMenuElmHTML, price = 0.00, orderItem, quant;

        $(document).on("click", "#rightSection ul.tabs a", function () {
            tabIndex = ~~this.getAttribute("tabindex");
            if (tabIndex !== self.flags.currentMenu && !self.flags.working && !self.flags.editing) {
                self.flags.currentMenu = tabIndex;
                self.flags.working = 1;
                $holdMenu = $("[index='"+tabIndex+"']");
                holdMenuElmHTML = $holdMenu[0].outerHTML;
                $holdMenu.remove();

                self.menuContainer.innerHTML = holdMenuElmHTML + self.menuContainer.innerHTML;
                

                $holdMenu = $("[index='"+tabIndex+"']");
                self.$menu().fadeOut("slow");
                $holdMenu.slideDown("slow", function () {self.flags.working = 0}); //change menu
                $(".price").each(function () {if(!this.innerHTML.length){
            this.className += " hide";
            this.parentNode.getElementsByClassName("qty")[0].className += " hide"
        }})
            }
        }).on("click", "#rightSection .menu", function () {
            self.$menu().removeClass("menuEdit");
            if (self.flags.editing) {

                this.className += " menuEdit";
                self.flags.editingMenu = ~~this.getAttribute("index");
                self.buttons[5].disabled = false;
                self.buttons[6].disabled = false;
            }
        }).on("click", "#rightSection .qty", function () {
            price = 0;
            orderItem = this.parentNode;

            document.getElementById("order")
                    .getElementsByTagName("ul")[0].innerHTML +=
            "<li>"+orderItem.getElementsByTagName("strong")[0].innerHTML+" <strong>$"
                  +orderItem.getElementsByClassName("price")[0].innerHTML+"</strong><input type='text' class='quant' value='1'><span class='close'>Remove Item</span></li>";

            self.updateOrderPrices();

            document.getElementById("orderButton").className = "block";
        }).on("change","input[type=text]", function () {

            this.setAttribute("value",this.value);

        }).on("keyup","input[type=text]", function () {
            if(this.className === "quant") {
                self.updateOrderPrices();
            }
        }).on("click","#order .close", function () {
            $(this.parentNode).remove();
            self.updateOrderPrices();
        });

    },
    updateOrderPrices: function () {
        var self = this, price = 0,quant;

        $("#order ul strong").each(function () {
            quant = parseFloat(this.parentNode.children[1].value);
            if(isNaN(quant)) {
                quant = 0;
            }
            price += parseFloat(this.innerHTML.slice(1,10))*quant;
        });
        document.getElementById("orderPrice").innerHTML = "Total: $"+price.toFixed(2);
    },
    enableAdminPanel: function () {
        var self = this;
        $("#adminPanel").fadeIn();
        $("#leftSection .adminAuth").slideUp();
        self.buttons[0].disabled = false;
        self.buttons[1].disabled = true;
        self.buttons[2].disabled = false;
        self.buttons[4].disabled = true;
        self.buttons[5].disabled = true;
        self.buttons[6].disabled = true;
        self.buttons[7].disabled = true;
    },
    checkPassword: function () {
        var self = this;
        $.ajax({
            cache:false,
            async:false,
            dataType:"text",
            type:"POST",
            url:"assets/data/validation.php",
            data:"pass="+document.getElementById("passInput").value
        }).done(function (data) {
            self.flags.passwordValid = !!JSON.parse(data);
            if (self.flags.passwordValid) {
                self.enableAdminPanel();
            }
        })
    },
    addMenu: function () {
        var self = this;
        $("input",self.menuContainer).each(function () {
            if(this.value) {
                this.setAttribute("value",this.value)
            }
        });
        self.ulTabs.innerHTML +=
            "<li><a tabindex=\""+ self.flags.maxIndex +"\"><input type=\"text\" value=\"MenuName\"></a></li>";
        self.menuContainer.innerHTML = self.menuContainer.innerHTML +
            "<div class=\"menu\" style=\"display:block\" index=\"" + self.flags.maxIndex + "\">"+
            "<h2><input type=\"text\" value=\"Menu header\"></h2>"+
            "<ol><li><button class=\"qty hide\">Add to order</button><strong><input type=\"text\" value=\"Item Name\"></strong><br>"+
        "<input class=\"desc\" type=\"text\" value=\"Item Description\"><input class=\"price\" type=\"text\" value=\"0.00\"></li></ol></div>";
        self.flags.maxIndex++;
        
    },
    removeMenu: function () {
        var self = this;
        self.flags.maxIndex--;
        $("li",self.ulTabs).last().remove();
        $(".menu",self.menuContainer).last().remove();
    },
    addItem: function () {
        if($(".menuEdit").length) {
            var self = this,
                elmOL = self.menuContainer.getElementsByClassName("menu")
                    [self.flags.editingMenu].getElementsByTagName("ol")[0];

            $("input",self.menuContainer).each(function () {
                if(this.value) {
                    this.setAttribute("value",this.value)
                }
            });
            elmOL.innerHTML += 
            "<li><button class=\"qty hide\">Add to order</button><strong><input type=\"text\" value=\"Item Name\"></strong><br>"+
            "<input class=\"desc\" type=\"text\" value=\"Item Description\"><input class=\"price\" type=\"text\" value=\"0.00\"></li>";
        }
    },
    removeItem: function () {
        if($(".menuEdit").length) {
            var self = this,
                elmOL = self.menuContainer.getElementsByClassName("menu")
                    [self.flags.editingMenu].getElementsByTagName("ol")[0];

            $("li",elmOL).last().remove();
        }
    },
    setMenuItems: function () { //set menu items from local JSON
        var self = this, root = self.root,menuName,n=0,nn=0,menuElm,menuElmH2, index,
            menuContainer = self.menuContainer, ulTabs = self.ulTabs,
            elmOL,menuObj,htmlHold = [],day = new Date().getDay();

        ulTabs.innerHTML = "";
        menuContainer.innerHTML = "";
        self.menus = [];

        for (n=0; menuName = self.data.menuItemsData.menus[n]; n++) {
            console.log(menuName);
            ulTabs.innerHTML += "<li><a tabindex=\""+n+"\">"+menuName+"</a></li>";
            menuName = menuName.replace(/ /g,"");
            menuContainer.innerHTML += 
                "<div id=\""+menuName+"\" class=\"menu\" index=\""+n+"\">"+
                    "<h2>"+self.data.menuItemsData[menuName].title+"</h2><ol></ol>"+
                "</div>";
            menuElm = document.getElementById(menuName);

            elmOL = menuElm.getElementsByTagName("ol")[0];
            elmOL.innerHTML = "";

            while(menuObj = self.data.menuItemsData[menuName].items[nn++]) {
                htmlHold.push("<li><button class=\"qty\">Add to order</button><strong>"+menuObj.item+"</strong><br>")
                htmlHold.push("<span class=\"desc\">"+menuObj.description+"</span><span class=\"price\">");
                if (menuObj.weekendPrice && (day===0 || day===6)) {
                    htmlHold.push(menuObj.weekendPrice+"</span>");
                } else {
                    htmlHold.push(menuObj.price+"</span>");
                }
            }
            nn = 0;
            elmOL.innerHTML = htmlHold.join("");
            htmlHold = [];
        }
        self.$menu().first().fadeIn();
        self.flags.maxIndex = n;
    },
    printOrder: function () {

    
    // Create a form
    var mapForm = document.createElement("form");
    mapForm.target = "_blank";    
    mapForm.method = "POST";
    mapForm.action = "printorder.php";

    // Create an input
    var mapInput = document.createElement("input");
    mapInput.type = "text";
    mapInput.name = "munnoOrder";
    mapInput.value = document.getElementById("order")
                     .innerHTML.replace("Current Order","");

    // Add the input to the form
    mapForm.appendChild(mapInput);

    // Add the form to dom
    document.body.appendChild(mapForm);

    // Just submit
    mapForm.submit();
    setTimeout(function () {$(mapForm).remove()},500);         
    },
    editItems: function () {
        var self = this, values = [], index,
            n=0, h2, menuElm, menuHTML=[], $container = $(self.menuContainer);

        self.flags.editing = 1;
        self.flags.working = 1;

        self.menus = [];
        self.buttons[0].disabled = true;
        self.buttons[1].disabled = false;
        self.buttons[2].disabled = true;
        self.buttons[3].disabled = true;
        self.buttons[4].disabled = false;
        self.buttons[5].disabled = false;
        self.buttons[6].disabled = false;
        self.buttons[7].disabled = false;

        self.$menu().show()
          .each(function() {
            index = ~~this.getAttribute("index");
            menuHTML[index] = this.outerHTML;
        });

        self.menuContainer.innerHTML = menuHTML.join("");

        self.$menu().each(function () {
            h2 = this.getElementsByTagName("h2")[0];
            h2.innerHTML = "<input type=\"text\" value=\"" + h2.innerHTML + "\">";
            $("li",this).each(function () {
                values.push(this.children[1].innerHTML,
                            this.children[3].innerHTML,
                            this.children[4].innerHTML);

                    this.innerHTML = "<button class=\"qty hide\">Add to order</button><strong><input type=\"text\"></strong><br><input class=\"desc\" type=\"text\"><input class=\"price\" type=\"text\">"
                    this.children[1].firstChild.value = values[0];
                    this.children[3].value = values[1];
                    this.children[4].value = values[2];
                values=[];
            })
        })
        $(self.menuContainer).hide().fadeIn("fast", function () {self.flags.working = 0});
    },
    saveEdits: function () {
        var self = this;
        self.saveItems();
        self.flags.editing = 0;
        $(".qty").removeClass("hide");
        self.buttons[0].disabled = false;
        self.buttons[1].disabled = true;
        self.buttons[2].disabled = false;
        self.buttons[3].disabled = false;
        self.buttons[4].disabled = true;
        self.buttons[5].disabled = true;
        self.buttons[6].disabled = true;
        self.buttons[7].disabled = true;
        self.data.saveMenuData();
        $(".price").each(function () {if(!this.innerHTML.length){
            this.className += " hide";
            this.parentNode.getElementsByClassName("qty")[0].className += " hide"
        }})
    },
    saveItems: function () {
        var self = this, menuInstance,n=0,nn=0,h2, index,
            values = [], menuName, newName;

        self.data.menuItemsData = {"menus":[]};
        self.$menus = $("#rightSection .menu");
        self.$menu().each(function (i) {
            console.log(i);
            this.className = "menu";

            index = ~~this.getAttribute("index");
            $tab = $("a[tabIndex='"+index+"']");
//
            h2 = this.getElementsByTagName("h2")[0];

            if($tab.find("input")[0]) { 
                menuInstance = $tab.find("input")[0].value || this.id;
                $tab[0].innerHTML = menuInstance;
            } else {
                menuInstance = $tab[0].innerHTML || this.id;
            }
            if(h2.firstChild.value) {
                h2.innerHTML = h2.firstChild.value;
            }
            menuName = null;
            console.log(menuInstance);
            self.data.menuItemsData.menus[index] = menuInstance;
            menuInstance = menuInstance.replace(/ /g,"");
            self.data.menuItemsData[menuInstance] = {"title":h2.innerHTML,"items":[]};
            
            $("li", this).each(function () {
                if(this.children[1].firstChild.value) {
                    values.push(this.children[1].firstChild.value.replace(/"/g,"#"),
                                this.children[3].value.replace(/"/g,"#"),
                                this.children[4].value.replace(/"/g,"#"));
                    

                    this.innerHTML = '<button class=\"qty\">Add to order</button><strong></strong><br><span class="desc"></span><span class="price"></span>'

                    this.children[1].innerHTML = values[0];
                    this.children[3].innerHTML = values[1];
                    this.children[4].innerHTML = values[2];
                    values = [];
                    self.data.menuItemsData[menuInstance]["items"].push({
                        "item": this.getElementsByTagName("strong")[0].innerHTML,
                        "description": this.getElementsByTagName("span")[0].innerHTML,
                        "price": this.getElementsByTagName("span")[1].innerHTML
                    })
                }   
            })
        });
    },
    restoreMenu: function () {
       var self = this;
       self.data.menuItemsData = self.data.menuItemsDataBackup;
       self.setMenuItems();
    },
    data: {
        saveMenuData: function () { //save JSON to server
            $.ajax({
                cache:false,
                async:false,
                type:"POST",
                dataType:"text",
                data:"menuJson="+JSON.stringify(this.menuItemsData).replace(/&/g,"####"),
                url:"assets/data/in.php"
            }).done(function (e) { console.log(deli.data.menuItemsData) });
        },  
        getMenuData: function () { //get JSON from server
            var self = this, n,jsonString;
            $.ajax({
                cache:false,
                async:false,
                url:"assets/data/out.php",
                dataType:"json"
            }).done(function(data){
                jsonString = JSON.stringify(data).replace(/####amp;/g,"&").replace(/####/g,"&");
                if (jsonString.length < 5) {
                    console.log("Messed up JSON file, restructuring data...");
                    if (JSON.stringify(self.menuItemsData).length < 5) {
                        self.menuItemsData = self.menuItemsDataBackup;
                    }
                } else {
                    console.log(jsonString);
                    self.menuItemsData = JSON.parse(jsonString);
                }
                self.menus = self.menuItemsData.menus;
            });
        },
        menus:["lunch", "dinner", "catering", "specials"],
        menuItemsData:{},
        menuItemsDataBackup: {
           "menus":[
              "Catering Trays",
              "Platters",
              "Heros & Sandwiches",
              "Buffets",
              "Extras"
           ],
           "CateringTrays":{
              "title":"Hot Trays To Bring Home- All trays are prepared in 1/2 trays and they will serve 8 to 10 people. ( *Marked Items are $10.00 extra if included in buffets and all prices below do not include sales tax)",
              "items":[
                 {
                    "item":"Penne Ala Vodka",
                    "description":"",
                    "price":"33.95"
                 },
                 {
                    "item":"Pasta Primavera",
                    "description":"",
                    "price":"36.95"
                 },
                 {
                    "item":"Tortellini Alfredo",
                    "description":"",
                    "price":"37.95"
                 },
                 {
                    "item":"Lasagna",
                    "description":"",
                    "price":"34.95"
                 },
                 {
                    "item":"Baked Ziti",
                    "description":"",
                    "price":"28.95"
                 },
                 {
                    "item":"Pasta & Broccoli",
                    "description":"",
                    "price":"33.95"
                 },
                 {
                    "item":"Stuffed Shells",
                    "description":"",
                    "price":"33.95"
                 },
                 {
                    "item":"Manicotti",
                    "description":"",
                    "price":"36.95"
                 },
                 {
                    "item":"Sausage & Peppers",
                    "description":"",
                    "price":"36.95"
                 },
                 {
                    "item":"Meatballs",
                    "description":"",
                    "price":"32.95"
                 },
                 {
                    "item":"Steak Pizzaiole",
                    "description":"",
                    "price":"55.00"
                 },
                 {
                    "item":"Shepard's Pie",
                    "description":"",
                    "price":"39.95"
                 },
                 {
                    "item":"Roast Pork Loin in Gravy*",
                    "description":"",
                    "price":"53.95"
                 },
                 {
                    "item":"Pork Chop Parmigiana",
                    "description":"",
                    "price":"41.95"
                 },
                 {
                    "item":"Veal, Peppers & Mushrooms*",
                    "description":"",
                    "price":"58.95"
                 },
                 {
                    "item":"Veal Cutlet Parmigiana*",
                    "description":"",
                    "price":"61.95"
                 },
                 {
                    "item":"Veal Francaise*",
                    "description":"",
                    "price":"61.95"
                 },
                 {
                    "item":"Eggplant Rollatine",
                    "description":"",
                    "price":"38.95"
                 },
                 {
                    "item":"Eggplant Parmigiana",
                    "description":"",
                    "price":"36.95"
                 },
                 {
                    "item":"Chicken Fingers",
                    "description":"",
                    "price":"36.95"
                 },
                 {
                    "item":"Chicken Francaise",
                    "description":"",
                    "price":"41.95"
                 },
                 {
                    "item":"Chicken Cutlet Parmigiana",
                    "description":"",
                    "price":"41.95"
                 },
                 {
                    "item":"Lemon Chicken ",
                    "description":"",
                    "price":"41.95"
                 },
                 {
                    "item":"Fried Chicken",
                    "description":"",
                    "price":"39.95"
                 },
                 {
                    "item":"Chicken Marsala/white rice*",
                    "description":"",
                    "price":"48.95"
                 },
                 {
                    "item":"Chicken Champagne/white rice*",
                    "description":"",
                    "price":"48.95"
                 },
                 {
                    "item":"Chicken Cacciatore*",
                    "description":"",
                    "price":"41.95"
                 },
                 {
                    "item":"Beef & Broccoli",
                    "description":"",
                    "price":"51.95"
                 },
                 {
                    "item":"Rice Pilaf",
                    "description":"",
                    "price":"22.00"
                 },
                 {
                    "item":"White Rice",
                    "description":"",
                    "price":"10.00"
                 },
                 {
                    "item":"Oven Roasted Potatoes",
                    "description":"",
                    "price":"29.95"
                 },
                 {
                    "item":"String Bean Almondine",
                    "description":"",
                    "price":"29.95"
                 },
                 {
                    "item":"Buffalo Wings",
                    "description":"",
                    "price":"50.00"
                 },
                 {
                    "item":"Mashed Potatoes",
                    "description":"",
                    "price":"29.95"
                 }
              ]
           },
           "Platters":{
              "title":"Antipasto, Chunk Cheese, Vegetable and Fruit Platters all prepared fresh. ( Note: prices subject to change without notice due to market conditions.)",
              "items":[
                 {
                    "item":"Antipasto Platters",
                    "description":"Includes Prosciutto w/ bread sticks, Mortadella, Fresh Mozzarella,Italian Cappicola, Soppressata, Artichoke Hearts, Olives, Roasted Peppers & imported Provolone.",
                    "price":""
                 },
                 {
                    "item":"16 Inch Platter",
                    "description":"",
                    "price":"79.95"
                 },
                 {
                    "item":"18 Inch Platter",
                    "description":"",
                    "price":"99.95"
                 },
                 {
                    "item":"Chuck Cheese Platters",
                    "description":"Includes Smoked Gouda, Cheddar, Jalepeno Jack, Muenster, Havarti Dill, Pepperoni & Garnished with Grapes.",
                    "price":""
                 },
                 {
                    "item":"Small",
                    "description":"Serves 10-15 people",
                    "price":"43.95"
                 },
                 {
                    "item":"Medium",
                    "description":"Serves 20-25 people",
                    "price":"56.95"
                 },
                 {
                    "item":"Large",
                    "description":"Serves 30-40 People",
                    "price":"68.95"
                 },
                 {
                    "item":"Fresh Vegetable PLatters",
                    "description":"Includes Cucumbers, Celery, Baby Carrots, Broccoli Florets & Cherry Tomatoes with dip",
                    "price":""
                 },
                 {
                    "item":"Small",
                    "description":"Serves 10-15 people",
                    "price":"25.95"
                 },
                 {
                    "item":"Medium",
                    "description":"Serves 15-25 people",
                    "price":"35.95"
                 },
                 {
                    "item":"Large",
                    "description":"Serves 25-30 people",
                    "price":"45.95"
                 },
                 {
                    "item":"Fruit Platters",
                    "description":"Assorted Seasonal Fruit",
                    "price":""
                 },
                 {
                    "item":"Small",
                    "description":"Serves 10-15 people",
                    "price":"36.95"
                 },
                 {
                    "item":"Medium",
                    "description":"Serves 20-25 people",
                    "price":"48.95"
                 },
                 {
                    "item":"Large ",
                    "description":"Serves 25-30 people",
                    "price":"57.95"
                 },
                 {
                    "item":"Mozzarella & Tomato Platters",
                    "description":"Come with sliced mozzarella and sliced tomato with basil on top with a drizzle of oil.",
                    "price":""
                 },
                 {
                    "item":"Small",
                    "description":"",
                    "price":"28.95"
                 },
                 {
                    "item":"Medium",
                    "description":"",
                    "price":"38.95"
                 },
                 {
                    "item":"Large",
                    "description":"",
                    "price":"48.95"
                 }
              ]
           },
           "Heros&Sandwiches":{
              "title":"Our \"One of a Kind\" Over Stuffed Heros, also we have our Petite Heros, Finger Sandwiches, Baby Kaiser Sandwiches & Wraps.",
              "items":[
                 {
                    "item":"Italian Style Hero",
                    "description":"Genoa Salami, Ham, Pepperoni, Ham Cappy, Provolone, Lettuce, Tomatoes, Onions, Peppers, Spices, Oil & Vinegar",
                    "price":""
                 },
                 {
                    "item":"Small or 2ft.",
                    "description":"Has about 15 slices.",
                    "price":"39.00"
                 },
                 {
                    "item":"Medium or 3ft.",
                    "description":"Has about 25 slices.",
                    "price":"58.00"
                 },
                 {
                    "item":"Large or 4ft.",
                    "description":"Has about 34 slices.",
                    "price":"77.00"
                 },
                 {
                    "item":"American Style Hero",
                    "description":"Ham, Roast Beef, Turkey, Swiss, Lettuce & Tomatoes.",
                    "price":""
                 },
                 {
                    "item":"Small or 2ft.",
                    "description":"15 slices.",
                    "price":"40.00"
                 },
                 {
                    "item":"Medium or 3ft.",
                    "description":"25 slices.",
                    "price":"60.00"
                 },
                 {
                    "item":"Large or 4ft.",
                    "description":"34 slices.",
                    "price":"80.00"
                 },
                 {
                    "item":"Eggplant Style Hero",
                    "description":"Fried Eggplant, Roasted Peppers & Mozzarella.",
                    "price":""
                 },
                 {
                    "item":"Small or 2ft.",
                    "description":"15 slices.",
                    "price":"41.00"
                 },
                 {
                    "item":"Medium or 3ft.",
                    "description":"25 slices.",
                    "price":"60.00"
                 },
                 {
                    "item":"Large of 4ft.",
                    "description":"34 slices.",
                    "price":"80.00"
                 },
                 {
                    "item":"Breaded Chicken or Grilled Chicken Cutlet Style Hero",
                    "description":"Breaded Chicken Cutlets or Grilled Chicken Cutlets with Mozzarella & Roasted Peppers",
                    "price":""
                 },
                 {
                    "item":"Small or 2ft.",
                    "description":"15 slices.",
                    "price":"45.00"
                 },
                 {
                    "item":"Medium or 3ft.",
                    "description":"25 slices.",
                    "price":"67.00"
                 },
                 {
                    "item":"Large or 4ft.",
                    "description":"34.slices",
                    "price":"89.00"
                 },
                 {
                    "item":"Baby Kaiser Sandwiches",
                    "description":"Prepared by order of customer.",
                    "price":"3.25 each"
                 },
                 {
                    "item":"Finger Sandwiches",
                    "description":"Prepared by order of customer.",
                    "price":"5.75 each"
                 },
                 {
                    "item":"Petite Heros",
                    "description":"Prepared by order of customer.",
                    "price":"26.50 each"
                 },
                 {
                    "item":"Specialty Petite Heros",
                    "description":"Prepared by order of customer",
                    "price":"29.50 each"
                 },
                 {
                    "item":"Wraps",
                    "description":"Prepared by order of customer.",
                    "price":"7.50 each"
                 }
              ]
           },
           "Buffets":{
              "title":"Buffets are all based on 50 guests but will be adjusted based on guest number.",
              "items":[
                 {
                    "item":"Hot & Cold Buffet",
                    "description":"Package includes 8 hot trays and we suggest 3 choices of hot entrees. This also includes 2 Large Platters of Cold Cuts, Potato Salad, Macaroni Salad, Coleslaw, Olives, Pickles, Mustard, Mayo, Butter, Potato Chips, Rolls, White & Rye Bread.",
                    "price":"11.50 per person"
                 },
                 {
                    "item":"Hot Buffet",
                    "description":"Package includes 12 hot trays and we suggest 4 choices or 5 choices at the most. This also includes Tossed Salad with Italian dressing and Italian Bread or Dinner Rolls with butter",
                    "price":"10.95 per person"
                 },
                 {
                    "item":"Cold Buffet",
                    "description":"Package includes 2 Large Platters of Beautifully Arranged Cold Cuts and also comes with Potato Salad, Macaroni Salad, Coleslaw, Pickles, Condiments & Potato Chips",
                    "price":"7.95 per person"
                 },
                 {
                    "item":"Italian Style Buffet",
                    "description":"Prosciutto, Ham Cappicola, Genoa Salami, Pepperoni, Provolone, Roasted Pepper Salad, Macaroni & Potato Salad, with Bread and Butter. Also Available are our Mozzarella & Tomatoe Platters",
                    "price":"10.95 per person"
                 }
              ]
           },
           "Extras":{
              "title":"Extra items including salad, bread, and rack set ups ect.",
              "items":[
                 {
                    "item":"Tossed Salad",
                    "description":"Smallest salad made is for 10 people.",
                    "price":"1.75 per person"
                 },
                 {
                    "item":"Italian Bread",
                    "description":"One loaf.",
                    "price":"3.00"
                 },
                 {
                    "item":"Baby Kaiser Rolls",
                    "description":"Item Description",
                    "price":"4.00 per doz"
                 },
                 {
                    "item":"Rack set up",
                    "description":"Includes Racks, Sternos, Waterpans, Serving Spoons. (With each metal rack returned a $2.00 refund will apply if you are charged a deposit on the rack.)",
                    "price":"5.00 for one"
                 },
                 {
                    "item":"S&S Cheesecake",
                    "description":"Small",
                    "price":"22.00"
                 },
                 {
                    "item":"S&S Cheesecake",
                    "description":"Large",
                    "price":"35.00"
                 },
                 {
                    "item":"Mini Pastries",
                    "description":"Custom pastries and deserts Shop Located in Park Ridge, NJ. (Le Petit Gateau)",
                    "price":"13.95 per doz"
                 },
                 {
                    "item":"Cakes Provided By Le Petit Gateau",
                    "description":"Cakes Fillings, Icings, and sizes will be discussed per order.",
                    "price":"Prices vary from cake to cake."
                 }
              ]
           }
        }
    },
    integrations: function () {

      var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(41.059263,-74.019426),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      var map = new google.maps.Map(document.getElementById('map-canvas'),
          mapOptions);

      var marker = new google.maps.Marker({ map: map });
      marker.setPosition(mapOptions.center);
    }
}
window.self = deli;

     
    