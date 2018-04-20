
  angular.module('umlEditorApp', ['ui.bootstrap','cgNotify']);
  angular.module('umlEditorApp').controller('umlController',
	function ($scope, $http, notify, XMIService){
		  
      notify({
  		        message: "Merci de visiter le projet",		            
  		        templateUrl: '',
  		        position: 'left',
  		        classes: '',
  		        duration: 5000
        	  }); 


	  // Initialise la collection de tous les modèles de graphique.
      var graph = new joint.dia.Graph;

      // Initialise la vue pour tous les éléments du graphique.
      var paper = new joint.dia.Paper({
          el: $ ('#paper'), // Lie à un élément spécifique de la page.
          width: 2000, // Définit la largeur de la zone d'affichage.
          height: 2000, // Spécifie la hauteur de la zone d'affichage.
          gridSize: 5, // Définit la taille de la grille de la vue.
          model: graph // Liez la vue au modèle.
      });

      // Initialise les modèles uml.
      var uml = joint.shapes.uml;

      // Initialise la variable qui stockera la classe actuellement sélectionnée (pour mise à jour ultérieure).
      var curClass = {};

      // Initialise l'objet qui va stocker toutes les classes de graphique.
      var classes = {};

      // Initialise les vues pour afficher des informations sur la classe dans la barre latérale.
      $scope.className = {};
      $scope.classMethods = [];
      $scope.classAttributes = [];
      $scope.size = {};

      // Initialise la variable pour fermer les éléments DOM pour travailler avec la classe.
      $scope.showClassProperties = {
      	condition: false,
        message: "Aucun élément sélectionné"
      };

      // L'événement a fait défiler la souris, appelle la fonction de zoom avant / arrière de la zone d'affichage.
      paper.$el.on('mousewheel DOMMouseScroll', onMouseWheel);

      // Fonction de zoom avant / arrière de la zone d'affichage.
      function onMouseWheel(e) {      	
  	    e.preventDefault();
  	    e = e.originalEvent;	    
  	    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) / 50;

        // OffsetX n'est pas défini dans FF.
  	    var offsetX = (e.offsetX || e.clientX - $(this).offset().left); 

        // OffsetY n'est pas défini dans FF.
  	    var offsetY = (e.offsetY || e.clientY - $(this).offset().top); 
  	    var p = offsetToLocalPoint(offsetX, offsetY);

        // L'échelle de vue actuelle change de delta.
  	    var newScale = V(paper.viewport).scale().sx + delta; 
  	    if (newScale > 0.4 && newScale < 2) {

            // Réinitialise le décalage précédent.
  	        paper.setOrigin(0, 0); 
  	        paper.scale(newScale, newScale, p.x, p.y);
  	    }

        // Transforme le point dans le système de coordonnées de la fenêtre.
  	    function offsetToLocalPoint(x, y) {
  		    var svgPoint = paper.svg.createSVGPoint();
  		    svgPoint.x = x;
  		    svgPoint.y = y;  		    
  		    var pointTransformed = svgPoint.matrixTransform(paper.viewport.getCTM().inverse());
  		    return pointTransformed;
  		  }
	    }

	  // Fonction de réinitialisation de toutes les conditions de sélection des éléments à créer.
      $scope.refreshConditions = function(){      	
        $scope.classCondition = false;
        $scope.interfaceCondition = false;
        $scope.abstractCondition = false;
        $scope.associationCondition = false;
        $scope.compositionCondition = false;
        $scope.generalizationCondition = false;
        $scope.referenceCondition = false;
        $scope.source = undefined;
        $scope.target = undefined;
      };
      // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
      $scope.refreshConditions();
      
      // Cliquez sur l'événement dans l'élément de graphique.
      paper.on('cell:pointerdown', function(cellView, evt, x, y) {
        // Si nous avons cliqué sur une classe (pas par lien).
        if (cellView.model.toJSON().umlType == "Class"){

          // Initialise la variable avec la classe svg de l'élément sur lequel on a cliqué.
          var svgClass = evt.target.parentNode.getAttribute('class');

          // Ouvre la barre latérale avec le nom de la classe.
          $scope.statusClassNameOpen  = true;

          // Si vous cliquez sur svg, l'élément de suppression de classe.
          if (svgClass == 'element-tool-remove') {           
            curClass = cellView.model.toJSON().id;
            $scope.deleteClass();
            $scope.className = {};
            $scope.classMethods = [];
            $scope.classAttributes = [];
            $scope.showClassProperties.condition = false;
            $scope.$apply();
            return;
          }
          // Si vous cliquez sur une zone de l'élément svg, excepté la croix.
          else {

          // Si un lien a été sélectionné avant le clic, initialisez les éléments pour créer le lien.
          if ($scope.referenceCondition == true) {

            // Si c'est le premier élément de communication, alors nous définissons le début de la connexion.
            if (!$scope.source) {            
              $scope.source = cellView.model.toJSON().id;            
            }
            // Si ce n'est pas le premier élément de communication, alors nous définissons la fin de la connexion.
            else {
              $scope.target = cellView.model.toJSON().id;            
              if ($scope.source != $scope.target) {

                // Basculer pour créer des liens.
                switch (true) {
                  case $scope.associationCondition:

                    // Initialise l'association d'association.
                    var assosiation = new uml.Association({
                                                            source: {id: $scope.source}, 
                                                            target: {id: $scope.target},
                                                            labels: [
                                                                      { position: 25, attrs: { text: { text: '*' } } },        
                                                                      { position: -25, attrs: { text: { text: '1' } } }]
                                                          });

                    // Ajouter un nouveau lien à la collection de modèles de graphiques.
                    graph.addCell(assosiation);

                    // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
                    $scope.refreshConditions();            
                    break;
                  case $scope.compositionCondition:

                    // Initialise la composition du lien.
                    var composition = new uml.Composition({
                                                            source: {id: $scope.source}, 
                                                            target: {id: $scope.target},
                                                            labels: [
                                                                      { position: 25, attrs: { text: { text: '*' } } },        
                                                                      { position: -25, attrs: { text: { text: '1' } } }]
                                                          });

                    // Ajouter un nouveau lien à la collection de modèles de graphiques.
                    graph.addCell(composition);

                    // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
                    $scope.refreshConditions();            
                    break;
                  case $scope.generalizationCondition:

                    // initialise le lien d'héritage.
                    var generalization = new uml.Generalization({
                                                                  source: {id: $scope.source}, 
                                                                  target: {id: $scope.target}
                                                                });

                    // Ajouter un nouveau lien à la collection de modèles de graphiques.
                    graph.addCell(generalization);

                    // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
                    $scope.refreshConditions();            
                    break;
                }                
              }
              else {                
                notify({
                message: "Pour le moment, une telle connexion n'est pas fournie",
                templateUrl: '',
                position: 'right',
                classes: "alert-danger",
                duration: 5000
                });                
                // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
                $scope.refreshConditions();
              }
            }        
          }

          // affecter la classe actuelle
          curClass = cellView.model.toJSON().id;

          // Initialise les vues pour afficher des informations sur la classe dans la barre latérale.
          $scope.classMethods = cellView.model.toJSON().methods;
          $scope.classAttributes = cellView.model.toJSON().attributes;
          $scope.className = { 
            name: cellView.model.toJSON().name
          };          
          $scope.size = {
            width: cellView.model.toJSON().size.width,
            height: cellView.model.toJSON().size.height
          };

          // Supprime le talon pour s'assurer que la classe n'est pas sélectionnée.
          $scope.showClassProperties.condition = true;

          // Appelez la fonction d'initialisation de type pour le menu latéral.
          typesInit();

          // Mettre à jour toutes les vues.
          $scope.$apply();

          }
          
        }        
      });      
	  
      // Cliquez sur la zone vide du graphique.
      paper.on('blank:pointerdown', function(evt, xPosition, yPosition) {
      	
        // Mettre un talon pour s'assurer que la classe n'est pas sélectionnée.
      	$scope.showClassProperties.condition = false;
      	
        // Basculer pour créer une classe.
        switch (true) {

          // Crée la classe.
          case $scope.classCondition: 

            // Initialise la nouvelle classe uml à partir des templates avec join.uml.
            var newClass = new uml.Class();

            // Ajoute une nouvelle classe à l'objet avec les classes.
            classes[newClass.id] = newClass;

            // La fonction pour initialiser une nouvelle classe.
            classInit(newClass);

            // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
            $scope.refreshConditions();

            // Ouvre la barre latérale avec le nom de la classe.
            $scope.statusClassNameOpen  = true; 
            break;

          // Crée l'interface.
          case $scope.interfaceCondition:

            // Initialise la nouvelle interface uml à partir des templates avec join.uml.
            var newClass = new uml.Interface();

            // Ajoute une nouvelle classe à l'objet avec les classes.
            classes[newClass.id] = newClass;

            // la fonction d'initialisation d'une nouvelle classe.
            classInit(newClass); 

            // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
            $scope.refreshConditions();

            // Ouvre la barre latérale avec le nom de la classe.
            $scope.statusClassNameOpen = true;
            break;

          // Crée une classe abstraite.
          case $scope.abstractCondition:

            // Initialise la nouvelle interface uml à partir des templates avec join.uml.
            var newClass = new uml.Abstract();

            // Ajoute une nouvelle classe à l'objet avec les classes.
            classes[newClass.id] = newClass;

            // La fonction pour initialiser une nouvelle classe.
            classInit(newClass); 

            // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
            $scope.refreshConditions();

            $scope.statusClassNameOpen  = true;
            break;

          // Crée une connexion (réinitialise toutes les conditions de sélection précédemment sélectionnées).
          case $scope.referenceCondition:

            // Appelez la fonction pour réinitialiser toutes les conditions de sélection pour la création.
            $scope.refreshConditions();            
            break;
        }

        function classInit(newClass) {

          // Ajoute les attributs nécessaires à la classe.
          classes[newClass.id].attributes.position = { x:xPosition  , y: yPosition};
          classes[newClass.id].attributes.size= { width: 150, height: 100 };
          classes[newClass.id].setClassName("NewClass");
          classes[newClass.id].attributes.attributes = [];
          classes[newClass.id].attributes.methods = [];

          // Ajouter une nouvelle classe à la collection d'éléments.
          graph.addCell(classes[newClass.id]);

          // Affecte la classe en cours.
          curClass = newClass.id;

          // Initialise les éléments DOM pour travailler avec la classe.
          $scope.showClassProperties.condition = true;   
          $scope.className = {name: "NewClass"};
          $scope.classMethods = [];
          $scope.classAttributes = [];
          typesInit();
          $scope.size = {
            width: "150",
            height: "100"
          }                  
          $scope.$apply();                  
        }                            
      });


      // Fonction d'initialisation des types: types, types de méthode et typesWithClasses.
      function typesInit() {
        $scope.types = [ 
          "String", 
          "Int", 
          "Boolean", 
          "Date",
          "Double",
          "Long",
          "Float",
          "Short"
        ];
        $scope.methodTypes = ["Void"];
        $scope.typesWithClasses = []; 
        _.each($scope.types, function(type) {           
          $scope.typesWithClasses.push(type);
          $scope.methodTypes.push(type);                    
        });
        if (graph.toJSON().cells.length != 0) {
          _.each(graph.toJSON().cells, function(classItem) {
            if (classItem.umlType == "Class"){
              $scope.typesWithClasses.push(classItem.name);
              $scope.methodTypes.push(classItem.name)
            }          
          });
        };     
      };

      // La fonction de redimensionnement d'une classe.
      $scope.changeSize = function(){           	
      	classes[curClass].resize($scope.size.width, $scope.size.height);      	
      }

       // La fonction pour supprimer une classe.
      $scope.deleteClass = function() {        
        classes[curClass].remove();             
        delete classes[curClass];       
        $scope.className = {};
        $scope.classMethods = [];
        $scope.classAttributes = [];
        $scope.showClassProperties.condition = false;
                 
      }

       // Fonction pour changer le nom, les méthodes ou les attributs d'une classe.
      $scope.changeClassDetails = function() {
        classes[curClass].setClassName($scope.className.name);        
        updateAttributes(); 
        updateMethods();

      };

       // Fonction d'ajout d'un attribut.
      $scope.addAtr = function() {
        newAttribute = {
          name: "Newattribute",
          type: null
        };
        $scope.classAttributes.push(newAttribute);        
        updateAttributes();        
      };

       // Fonctionne pour supprimer l'attribut.
      $scope.deleteAtr = function(index) {        
        $scope.classAttributes.splice(index, 1);        
        updateAttributes();        
      };

       // Fonction d'ajout d'une méthode.
      $scope.addMethod = function(){
        newMethod = {
          name: "NewMethod",
          type: "Void",
          parameters: []
        };
        $scope.classMethods.push(newMethod);                   
        updateMethods();
      };

       // Fonction pour supprimer une méthode.
      $scope.deleteMethod = function(index){              
        $scope.classMethods.splice(index, 1);                
        updateMethods(); 
      }

       // Fonction d'ajout d'un paramètre.
      $scope.addParam = function(index) {
        newParam = {
          name: "NewParam",
          type: null
        };
        $scope.classMethods[index].parameters.push(newParam);            
        updateMethods();
      }

       // Fonction de suppression de paramètre.
      $scope.deleteParam = function(index, parent) {
        $scope.classMethods[parent.$index].parameters.splice(index, 1);            
        updateMethods();
      }; 

       // Fonction de mise à jour Aribut pour l'élément de graphique
      function updateAttributes(){
        var attributes = []; 
        classes[curClass].attributes.attributes=$scope.classAttributes;               
        _.each($scope.classAttributes, function(attribute) {
          var attributeString = attribute.name;
          if (attribute.type !=null) {
            attributeString = attributeString + ': ' + attribute.type;
          }
          attributes.push(attributeString);   
        });
        classes[curClass].setAttrs(attributes);
      };
       // la fonction de mise à jour de la méthode pour l'élément de graphique
      function updateMethods(){
        var methods = [];
        classes[curClass].attributes.methods = $scope.classMethods;             
        _.each($scope.classMethods, function(method){
          var parametersString = "";
          if (method.parameters.length != 0){
            for (var i = 0; i < method.parameters.length; i++) {
              if (i == 0){
                parametersString = method.parameters[0].name;
                if (method.parameters[0].type != null){
                  parametersString = parametersString + ': ' + method.parameters[0].type;
                }
              }
              else {
                parametersString = parametersString + ', ' + method.parameters[i].name;
                if (method.parameters[i].type != null){
                  parametersString = parametersString + ': ' + method.parameters[i].type;
                }
              }
            };                
          };                       
          var methodString = method.name + '(' + parametersString +'): ' + method.type;
          methods.push(methodString);   
        });        
        classes[curClass].setMethods(methods);
      };
       // exporter xmi
	  $scope.exportXMI = function(){
        // appelle le service XMIService, lui passe tous les éléments du graphique, renvoie le XMI dans la ligne
        var content = XMIService.export(graph.toJSON().cells);
        if (content){
          var blob = new Blob([content], { type: 'text/plain' });
          var downloadLink = angular.element('<a></a>');
          downloadLink.attr('href',window.URL.createObjectURL(blob));
          downloadLink.attr('download', 'diagram.xmi');
          downloadLink[0].click();         
          downloadLink = undefined;
        }
      }

	});
	
	
