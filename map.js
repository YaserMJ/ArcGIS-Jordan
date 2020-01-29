/*
    ===========================================================================================================
    =                                  Yaser Saleh - Web & Mobile Developer                                   =
    =                                                                                                         =
    = GitHub : YaserMJ                                                                                        =
    = LinkedIn : https://www.linkedin.com/in/yaser-saleh-1152b6192/                                           =
    = Mobile : 00962790809202                                                                                 =
    ===========================================================================================================

*/
require([
  // ArcGIS
  "esri/WebMap",
  "esri/views/MapView",

  // Widgets
  "esri/widgets/Home",
  "esri/widgets/Zoom",
  "esri/widgets/Compass",
  "esri/widgets/Search",
  "esri/widgets/Legend",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/geometry/Point",
  "esri/Graphic",
  "esri/widgets/BasemapToggle",
  "esri/widgets/ScaleBar",
  "esri/widgets/Attribution",

  // Bootstrap
  "bootstrap/Collapse",
  "bootstrap/Dropdown",

  // Calcite Maps
  "calcite-maps/calcitemaps-v0.10",
  // Calcite Maps ArcGIS Support
  "calcite-maps/calcitemaps-arcgis-support-v0.10",

  "dojo/domReady!"
], function(
  WebMap,
  MapView,
  Home,
  Zoom,
  Compass,
  Search,
  Legend,
  FeatureLayer,
  GraphicsLayer,
  Point,
  Graphic,
  BasemapToggle,
  ScaleBar,
  Attribution,

  Collapse,
  Dropdown,
  CalciteMaps,
  CalciteMapArcGISSupport
) {
  //============================================Map=================================================//
  const map = new WebMap({
    portalItem: {
      id: "08d9176ca00448bab76fdb357a603b92"
    }
  });

  //=========================================MapView=================================================//
  const mapView = new MapView({
    container: "mapViewDiv",
    map: map,
    padding: {
      top: 50,
      bottom: 0
    },
    ui: { components: [] }
  });

  //=================================Popup and panel sync============================================//

  mapView.when(function() {
    CalciteMapArcGISSupport.setPopupPanelSync(mapView);
  });

  //=================================Search - add to navbar==========================================//

  const searchWidget = new Search({
    container: "searchWidgetDiv",
    view: mapView
  });
  CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

  //=====================================Map widgets=================================================//

  const home = new Home({
    view: mapView
  });
  mapView.ui.add(home, "top-left");

  const zoom = new Zoom({
    view: mapView
  });
  mapView.ui.add(zoom, "top-left");

  const compass = new Compass({
    view: mapView
  });
  mapView.ui.add(compass, "top-left");

  const basemapToggle = new BasemapToggle({
    view: mapView,
    secondBasemap: "satellite"
  });
  mapView.ui.add(basemapToggle, "bottom-right");

  const scaleBar = new ScaleBar({
    view: mapView
  });
  mapView.ui.add(scaleBar, "bottom-left");

  const attribution = new Attribution({
    view: mapView
  });
  mapView.ui.add(attribution, "manual");

  //===================================Panel widgets - add legend========================================//

  const legendWidget = new Legend({
    container: "legendDiv",
    view: mapView
  });

  // ========================================Feature Layers==============================================//
  //Governates layer
  const jordanGovs = new FeatureLayer({
    url:
      "https://services8.arcgis.com/qHjD7qvRpLDfQaeu/ArcGIS/rest/services/JordanMap/FeatureServer/2",
    outFields: ["GOV_NAME_AR"]
  });
  //  Districts layer
  const district = new FeatureLayer({
    url:
      "https://services8.arcgis.com/qHjD7qvRpLDfQaeu/ArcGIS/rest/services/JordanMap/FeatureServer/1"
  });
  // Parks and trees layer
  const parks = new FeatureLayer({
    url:
      "https://services8.arcgis.com/qHjD7qvRpLDfQaeu/ArcGIS/rest/services/JordanMap/FeatureServer/0"
  });

  // graphis layer instance
  const graphicsLayer = new GraphicsLayer();
  const graphicsLayerTwo = new GraphicsLayer();

  //adding district layer to the map
  map.add(district);
  //   ============================================Arrays====================================================//

  let govGeoCode = []; //holds governates name and geometry
  let disArray = []; //holds districts name and geometry
  let arr = []; // used by the chart function
    let arrOfParksNum = []; // holds the Park summation in each district
    let arrOfDistrictNoNames = []; //holds the district "names" as numbers
    let distGeoArray = disArray; // holds the geometry for each district
    let myNewChart;
  //   =====================================Governates querying==============================================//
  const govsQuery = jordanGovs.createQuery(); // starts a query on the Govs layer.
  govsQuery.outFields = ["GOV_NAME_AR", "GOV_CODE"]; // Query for governate names in arabic and governate codes

  jordanGovs.queryFeatures(govsQuery).then(function(response) {
    const features = response.features;
    // Loop through each response to get attributes and geomtries
    features.map(function(feature) {
      const name = feature.attributes.GOV_NAME_AR; // get arabic Governate name.
      const govCode = feature.attributes.GOV_CODE; // get governate code
      const govObj = {
        //assign the code,geometry and name to an object to be pushed to Governates array
        GOV_CODE: govCode,
        geometry: feature.geometry,
        name: name
      };
      // push the governate objected to the related array for later use.
      govGeoCode.push(govObj);
      // appends options to the governate select.
      $("#gov").append(`<option gov_code=${govCode}>${name}</option>`);
    });
  });
  //   ================================Governates change handler=============================================//
  $("#gov").change(function() {
    graphicsLayer.removeAll(); // removes previous Governate specific grahpics
    if (myNewChart) myNewChart.destroy();
    let govCode = event.target.selectedOptions[0].getAttribute("gov_code"); //retrieves selected governate's code
    govGeoCode.forEach(function(govie) {
      // check for governate id from array of govenates info if it matches the selected option
      if (govCode == govie.GOV_CODE) {
        selectedGeo = govie.geometry;
        // goes/zooms to the Govenate selected by the user
        mapView.goTo({
          target: selectedGeo, //geometry
          zoom: 10
        });
      }
    });
    districtFinder(selectedGeo); //calls district finder function once a governate is selected
    parksFinder(selectedGeo); // calls Parks finder function for the governate itself in general
    chartFunction(govCode); //calls the pie chart function for the governate itself.
    var fill = {
      type: "simple-fill",
      outline: { miterLimit: 15, width: 10, color: [255, 170, 0, 1] },
      color: [226, 119, 40, 0.11]
    };
    // Add the geometry and symbol to a new graphic
    var polygonGraphic = new Graphic({
      geometry: selectedGeo,
      symbol: fill
    });

    graphicsLayer.add(polygonGraphic);
  });
  //   =====================================Districts finder ==================================================//
  function districtFinder(selectedGeo) {
    // Districs querying depending on the user's governate pick(geometry).
    const districtQuery = district.createQuery();
    districtQuery.geometry = selectedGeo; //use previous point to allocate
    districtQuery.outFields = [
      "DISTRICT_NAME_AR",
      "DISTRICT_NAME_EN",
      "DIST_CODE"
    ]; // Query for district names in Arabic and English
    districtQuery.spatialRelationship = "intersects"; // by default

    //mapping and appending districts each time the user picks a governate
    district.queryFeatures(districtQuery).then(function(response) {
      const features = response.features;

      // takes the Arabic district name from the domain and sets it back to the application
      const arabicDistrictName = district.getFieldDomain("DISTRICT_NAME_AR", {
        lel: response.features
      });
      // takes the English district name from the domain and sets it back to the application
      const englishDistrictName = district.getFieldDomain("DISTRICT_NAME_EN", {
        lel: response.features
      });

      // dummy option for the District select
      $("#district").prepend(
        `<option selected disabled>اختر اللواء للبحث...</option>`
      );

      // loops through result to assign dist code,geometry and name
      features.map(function(feature) {
        var dist_code = feature.attributes.DIST_CODE;
        let disGeo = feature.geometry;
        let namie;

        var option = document.createElement("option"); // appending to the district select element
        arabicDistrictName.codedValues.map(function(name) {
          // assings the Arabic name to the matching district ID
          if (dist_code == name.code) {
            option.text = name.name;
            namie = name.name;
          }
        });
        englishDistrictName.codedValues.map(function(name) {
          // assings the English name to the matching district ID
          if (dist_code == name.code) {
            option.setAttribute("eng", name.name);
          }
        });
        let disObj = {
          DIST_CODE: dist_code,
          geometry: disGeo,
          name: namie
        };
        disArray.push(disObj); //pushes to the array of districts
        option.setAttribute("dist_code", dist_code); //sets a dis_code attribute to be used for matching
        $("#district").append(option); // appends the option to the select element
      });
    });
    // Empty district select to avoid duplication
    $("#district").text("");
  }
  //   ================================Districts change handler=================================================//
  $("#district").change(function() {
    graphicsLayer.removeAll(); // removes previous Governate specific grahpics
    let distCode = event.target.selectedOptions[0].getAttribute("dist_code"); //retrieves selected district's code

    disArray.forEach(function(dist) {
      // checks matching dist_code from the array to send back its geometry
      if (distCode == dist.DIST_CODE) {
        selectedGeo = dist.geometry;
        // goes/zooms to the Govenate selected by the user
        mapView.goTo({
          target: selectedGeo,
          zoom: 11
        });
        parksFinder(selectedGeo); // calls Parks finder function for the governate itself in general

        var fill = {
          type: "simple-fill",
          outline: { miterLimit: 15, width: 10, color: [255, 170, 0, 1] },
          color: [226, 119, 40, 0.11]
        };
        // Add the geometry and symbol to a new graphic
        var polygonGraphic = new Graphic({
          geometry: selectedGeo,
          symbol: fill
        });
        graphicsLayer.add(polygonGraphic);
      }
    });
  });
  //   ========================================Parks finder ==================================================//
  function parksFinder(selectedGeo) {
    $("#contentTable tbody").empty(); // empty the table to avoid duplication and unrelated data

    const parksQuery = parks.createQuery();
    parksQuery.geometry = selectedGeo; // uses sent geometry
    parksQuery.spatialRelationship = "contains"; //contains relationship to avoid outt of desired space parks.
    parksQuery.returnGeometry = true;
    parksQuery.outFields = [
      "LANDMARK_ANAME,LANDMARK_ENAME",
      "DIST_CODE",
      "GOV_CODE"
    ]; //land mark names in both Arabic and English and its gov code

    parks.queryFeatures(parksQuery).then(function(response) {
      const features = response.features;
      const count = features.length;
      features.map(function(feature) {
        let lat = feature.geometry.longitude; //park longitude
        let long = feature.geometry.latitude; //park latitude
        let arabicName = feature.attributes.LANDMARK_ANAME; //park landmark name in Arabic
        let englishName = feature.attributes.LANDMARK_ENAME; // park landmark name in English
        let govName = $("#gov option:selected").text(); // takes the selected governate Arabic name
        let districtName = $("#district option:selected").text(); // takes the selected district Arabic name
        let districtEnglishName = $("#district option:selected").attr("eng"); // takes the selected district English name from the eng attribute

        //create a point geometry that recives long and lat of parks.
        const point = {
          type: "point", // autocasts as new Point()
          longitude: feature.geometry.longitude,
          latitude: feature.geometry.latitude
        };

        // Create a symbol for drawing the point
        const markerSymbol = {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          color: [226, 119, 40],
          outline: {
            // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 2
          }
        };
        // Create an object for storing attributes related to the line
        const lineAtt = {
          ArabicName: feature.attributes.LANDMARK_ANAME,
          EnglishName: feature.attributes.LANDMARK_ENAME
        };

        // Create a graphic and add the geometry and symbol to it
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: lineAtt,
          popupTemplate: {
            // autocasts as new PopupTemplate()
            title: "{Name}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  {
                    fieldName: "ArabicName"
                  },
                  {
                    fieldName: "EnglishName"
                  }
                ]
              }
            ]
          }
        });
        // adds points to the graphic layer
        graphicsLayer.add(pointGraphic);
        // appends to the parks table
        $("#contentTable")
          .find("tbody")
          .append(
            $(`<tr lat=${lat} long=${long}>`).append(`<td>${englishName}</td>
                <td>${arabicName}</td>
                <td>${govName}</td>
                <td>${districtName}</td>
                <td>${districtEnglishName}</td>`)
          );
      });
      return count;
    });
  }
  map.add(graphicsLayer);
  //   ======================================Table press handler===============================================//
  $(function() {
    $("#contentTable").on("click", "tr", function() {
      // Create new point to allocate geometry
      const point = new Point({
        x: $(this).attr("lat"), //gets lat
        y: $(this).attr("long") //gets long
      });
      // goes to the desired park point
      mapView.goTo({
        target: point,
        zoom: 17
      });
    });
  });
  // =======================================Pie Chart function==================================================//
  function chartFunction(govCode) {
    arr.length = 0; // empty array to avoid duplication and unrelated data
    var query = parks.createQuery(); // creates a query on the parks feature layer
    query.where = `GOV_CODE = ${govCode}`; // query depending on the gov code
    query.outFields = ["LANDMARK_ENAME,DIST_CODE"]; // retrieves landmark name and dist code

    parks.queryFeatures(query).then(function(response) {
      let x = response.features;
      x.map(function(x) {
        code = x.attributes.DIST_CODE;
        name = x.attributes.LANDMARK_ENAME;
        var key = "code";
        var obj = {};
        obj[key] = code;
        arr.push(obj); // pushes the object to the array
      });
      districtReducer(arr); //calls the reducer function to reduce array counts to each district
    });
  }
  //========================================District Reducer======================================================//
  function districtReducer(arr) {
    // empty arrays to avoid unrelated data
    arrOfParksNum.length = 0;
    arrOfDistrictNoNames.length = 0;
    // reduce counts to each district code/name
    let res = arr.reduce(function(obj, v) {
      obj[v.code] = (obj[v.code] || 0) + 1;
      return obj;
    }, {});
    // creates key value pairs as array of objects and pushes it to the array.
    let arrayOfLabelesAndValues = [];
    for (key in res) {
      arrayOfLabelesAndValues.push(
        Object.assign({ y: res[key] }, { Label: key })
      );
    }
    // divides the data into two arrays to be used by Chart.js
    arrayOfLabelesAndValues.forEach(function(a) {
      arrOfParksNum.push(a.y);
      key = a.Label;
      switch (key) {
        case "1":
          arrOfDistrictNoNames.push("(1)لواء ماركا");
          break;
        case "2":
          arrOfDistrictNoNames.push("(2)لواء قصبة عمان");
          break;
        case "3":
          arrOfDistrictNoNames.push("(3)لواء القويسمة");
          break;
        case "4":
          arrOfDistrictNoNames.push("(4)لواء الموقر");
          break;
        case "5":
          arrOfDistrictNoNames.push("(5)لواء بني كنانة");
          break;
        case "6":
          arrOfDistrictNoNames.push("(6)لواء قصبة إربد");
          break;
        case "7":
          arrOfDistrictNoNames.push("(7)لواء الوسطية");
          break;
        case "8":
          arrOfDistrictNoNames.push("(8)لواء الأغوار الشمالية");
          break;
        case "9":
          arrOfDistrictNoNames.push("(9)لواء دير علا");
          break;
        case "10":
          arrOfDistrictNoNames.push("(10)لواء كفرنجة");
          break;
        case "11":
          arrOfDistrictNoNames.push("(11)لواء الطيبة");
          break;
        case "12":
          arrOfDistrictNoNames.push("(12)لواء الكورة");
          break;
        case "13":
          arrOfDistrictNoNames.push("(13)لواء المزار الشمالي");
          break;
        case "14":
          arrOfDistrictNoNames.push("(14)لواء البادية الشمالية الغربية");
          break;
        case "15":
          arrOfDistrictNoNames.push("(15)لواء بني عبيد");
          break;
        case "16":
          arrOfDistrictNoNames.push("(16)لواء بني عبيد");
          break;
        case "17":
          arrOfDistrictNoNames.push("(17)لواء قصبة عجلون");
          break;
        case "18":
          arrOfDistrictNoNames.push("(18)لواء الهاشمية");
          break;
        case "19":
          arrOfDistrictNoNames.push("(19)لواء الرمثا");
          break;
        case "20":
          arrOfDistrictNoNames.push("(20)لواء قصبة العقبة");
          break;
        case "21":
          arrOfDistrictNoNames.push("(21)لواء قصبة الطفيلة");
          break;
        case "22":
          arrOfDistrictNoNames.push("(22)لواء بصيرا");
          break;
        case "23":
          arrOfDistrictNoNames.push("(23)لواء الحسا");
          break;
        case "24":
          arrOfDistrictNoNames.push("(24)لواء البتراء");
          break;
        case "25":
          arrOfDistrictNoNames.push("(25)لواء الشوبك");
          break;
        case "26":
          arrOfDistrictNoNames.push("(26)لواء الحسينية");
          break;
        case "27":
          arrOfDistrictNoNames.push("(27)لواء القطرانة");
          break;
        case "28":
          arrOfDistrictNoNames.push("(28)لواء قصبة الكرك");
          break;
        case "29":
          arrOfDistrictNoNames.push("(29)لواء عي");
          break;
        case "30":
          arrOfDistrictNoNames.push("(30)لواء فقوع");
          break;
        case "31":
          arrOfDistrictNoNames.push("(31)لواء قصبة المفرق");
          break;
        case "32":
          arrOfDistrictNoNames.push("(32)لواء الأغوار الجنوبية");
          break;
        case "33":
          arrOfDistrictNoNames.push("(33)لواء الشونة الجنوبية");
          break;
        case "34":
          arrOfDistrictNoNames.push("(34)لواء عين الباشا");
          break;
        case "35":
          arrOfDistrictNoNames.push("(35)لواء ماحص والفحيص");
          break;
        case "36":
          arrOfDistrictNoNames.push("(36)لواء الرويشد");
          break;
        case "37":
          arrOfDistrictNoNames.push("(37)لواء البادية الشمالية");
          break;
        case "38":
          arrOfDistrictNoNames.push("(38)لواء القويرة");
          break;
        case "39":
          arrOfDistrictNoNames.push("(39)لواء قصبة معان");
          break;
        case "40":
          arrOfDistrictNoNames.push("(40)لواء المزار الجنوبي");
          break;
        case "41":
          arrOfDistrictNoNames.push("(41)لواء القصر");
          break;
        case "42":
          arrOfDistrictNoNames.push("(42)لواء سحاب");
          break;
        case "43":
          arrOfDistrictNoNames.push("(43)لواء قصبة جرش");
          break;
        case "44":
          arrOfDistrictNoNames.push("(44)لواء الجامعة");
          break;
        case "45":
          arrOfDistrictNoNames.push("(45)لواء قصبة الزرقاء");
          break;
        case "46":
          arrOfDistrictNoNames.push("(46)لواء الجيزة");
          break;
        case "47":
          arrOfDistrictNoNames.push("(47)لواء قصبة مادبا");
          break;
        case "48":
          arrOfDistrictNoNames.push("(48)لواء ذيبان");
          break;
        case "49":
          arrOfDistrictNoNames.push("(49)لواء وادي السير");
          break;
        case "50":
          arrOfDistrictNoNames.push("(50)لواء قصبة السلط");
          break;
        case "51":
          arrOfDistrictNoNames.push("(51)لواء حسبان");
          break;
        case "52":
          arrOfDistrictNoNames.push("(52)لواء ناعور");
          break;
        default:
          break;
      }
    });

    // Chart.js data object
    let data = {
      datasets: [
        {
          data: arrOfParksNum,
          backgroundColor: [
            "#3e95cd",
            "#8e5ea2",
            "#3cba9f",
            "#e8c3b9",
            "#c45850"
          ]
        }
      ],
      labels: arrOfDistrictNoNames
    };
    // Chart.js PieChart creation and manipulation
    const canvas = document.getElementById("pie-chart");
    const ctx = canvas.getContext("2d");
    myNewChart = new Chart(ctx, {
      type: "pie",
      data: data
    });
    // Click trigger on PieChart parts
    canvas.onclick = function(evt) {
      const activePoints = myNewChart.getElementsAtEvent(evt); // gets the active point
      if (activePoints[0]) {
        const chartData = activePoints[0]["_chart"].config.data; // chart data on active point of click
        const idx = activePoints[0]["_index"]; //index of the active point of click
        const label = chartData.labels[idx]; // label of the active point of click
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(label);
        cutLabel = matches[1];
        //map through districts Geometry array to check if the DIST_CODE matches and then get the desired geometry
        distGeoArray.map(function(dist) {
          if (dist.DIST_CODE == cutLabel) {
            selectedGeo = dist.geometry;
            mapView.goTo({
              target: selectedGeo,
              zoom: 14
            });
          }
        });
      }
    };
  }
});
// ==================================================Table search Handler=================================================//
function hanldeSearch() {
  const filter = document.querySelector("#placeSearch").value; //takes the value written by the user
  const trs = document.querySelectorAll("#contentTable tr:not(.header)"); //query inside the trs but not including the header one
  trs.forEach(
    tr =>
      (tr.style.display = [...tr.children].find(td =>
        td.innerHTML.includes(filter)
      )
        ? ""
        : "none")
  );
}
