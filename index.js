// BASE SETUP
// =============================================================================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var https = require('https');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();
var object = {
  author: {
    name: 'Rodrigo',
    lastname: 'Gonzalez Godoy'
  }
};

router.get('/items', function (req, res) {
  if(req.query.q){
    https.get(`https://api.mercadolibre.com/sites/MLA/search?q=${req.query.q}&limit=4`, function (resp) {
      var data = '';

      
      resp.on('data', function(chunk){
        data += chunk;
      });

      
      resp.on('end', function(){
        var mlData = JSON.parse(data);
        object.categories = (mlData.filters.length && mlData.filters[0].values.length) ? mlData.filters[0].values[0].path_from_root.map(function (value, index) {
          return value.name;
        }) : [];
        object.items = (mlData.results.length) ? mlData.results.map(function(value, index){
          var price = value.price.toString().split('.');
          return {
            id: value.id,
            title: value.title,
            price: {
              currency: value.currency_id,
              amount: parseInt(price[0]),
              decimals: parseInt(price[1])
            },
            picture: value.thumbnail,
            condition: value.condition,
            free_shipping: value.shipping.free_shipping,
            location: value.address.state_name
          };
        }) : [];
        res.json(object);
      });

    }).on("error", function(err){
      console.log("Error: " + err.message);
      res.status(err.status).json({
        error: err.message
      });
    });
  }else{
    res.status(400).json({ 
      error: "Bad Request"
    });
  }
});

router.get('/items/:id', function(req, res){
  if(req.params.id){
    https.get(`https://api.mercadolibre.com/items/${req.params.id}`, function (resp) {
      var data = '';

      
      resp.on('data', function (chunk) {
        data += chunk;
      });

      
      resp.on('end', function () {
        var itemData = JSON.parse(data);
        var price = itemData.price.toString().split('.');
        object.items = {
            id: itemData.id,
            title: itemData.title,
            price: {
              currency: itemData.currency_id,
              amount: parseInt(price[0]),
              decimals: parseInt(price[1])
            },
            picture: (itemData.pictures.length) ? itemData.pictures[0].url : null,
            condition: itemData.condition,
            free_shipping: itemData.shipping.free_shipping,
            location: itemData.seller_address.state.name
        }
        https.get(`https://api.mercadolibre.com/categories/${itemData.category_id}`, function (resp) {
          var data = '';

          
          resp.on('data', function (chunk) {
            data += chunk;
          });

          
          resp.on('end', function () {
            var categorie = JSON.parse(data);
            object.categories = (categorie.path_from_root.length) ? categorie.path_from_root.map(function (value, index) {
              return value.name;
            }) : [];
            https.get(`https://api.mercadolibre.com/items/${req.params.id}/description`, function (resp) {
              var data = '';

              
              resp.on('data', function (chunk) {
                data += chunk;
              });

              
              resp.on('end', function () {
                var description = JSON.parse(data);
                object.items.description = description.plain_text;
                res.json(object);
              });

            }).on("error", function (err) {
              console.log("Error: " + err.message);
              res.status(err.status).json({
                error: err.message
              });
            });
          });

        }).on("error", function (err) {
          console.log("Error: " + err.message);
          res.status(err.status).json({
            error: err.message
          });
        });
      });

    }).on("error", function (err) {
      console.log("Error: " + err.message);
      res.status(err.status).json({
        error: err.message
      });
    });
  }else{
    res.status(400).json({
      error: "Bad Request"
    });
  }
});

// ADD HEADERS
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);