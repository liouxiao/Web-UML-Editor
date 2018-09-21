angular.module('umlEditorApp').service('XMIService', function (notify){
    
    return {
      export: function(diagramElements) {
        var eClasses = [];
        var classes = [];
        var references = [];    
        var superTypes = [];
        var classesForMethods = {};        
        // go through all the elements of the diagram, fill in the eClasses, classes, references, superTypes
        _.each(diagramElements, function(object) {              
              switch (true) {
                case (object.type == "uml.Class"):
                  classes.push(object);
                  classesForMethods[object.name] = object.id;
                             
                  eClasses[object.id] = Ecore.EClass.create({ name: object.name });
                   // add attributes
                  _.each(object.attributes, function(attribute) {                                         
                    var atr =  Ecore.EAttribute.create({ 
                                                        name: attribute.name, 
                                                        eType: typeDefinition(attribute.type) // we should think about doing it
                                                      });                      
                    eClasses[object.id].get('eStructuralFeatures').add(atr);                      
                  }); 
                  break;
                case (object.type == "uml.Interface"):
                  classes.push(object);
                   classesForMethods[object.name] = object.id;
                  eClasses[object.id] = Ecore.EClass.create({                                                                     
                                                            name: object.name, 
                                                            interface: true
                                                          });
                   // add attributes
                  _.each(object.attributes, function(attribute) {                        
                    var atr =  Ecore.EAttribute.create({ 
                                                        name: attribute.name, 
                                                        eType: typeDefinition(attribute.type) 
                                                      });
                    eClasses[object.id].get('eStructuralFeatures').add(atr);                      
                  });
                  break;
                case (object.type == "uml.Abstract"):
                  classes.push(object);
                   classesForMethods[object.name] = object.id;
                    eClasses[object.id] = Ecore.EClass.create({ 
                                                              name: object.name, 
                                                              abstract: true
                                                            });
                   // add attributes
                  _.each(object.attributes, function(attribute){                        
                    var atr =  Ecore.EAttribute.create({ 
                                                        name: attribute.name, 
                                                        eType: typeDefinition(attribute.type) 
                                                      });
                    eClasses[object.id].get('eStructuralFeatures').add(atr);                      
                  });
                  break;
                case (object.type == "uml.Generalization"):
                  superTypes.push(object);
                  break;
                case (object.type == "uml.Association"):
                  references.push(object);
                  break;
                case (object.type == "uml.Composition"):
                  references.push(object);
                  break;                   
            }                  
        });   

        // if the diagram is not empty
        if (classes.length != 0) {
          var p = Ecore.EPackage.create({
            name: 'p',
            nsPrefix: 'p',
            nsURI: 'http://ecore.js/p'
          });
          var source;
          var target;
           // add an inheritance link
          _.each(superTypes, function(superType) {
              source = superType.source.id;
              target = superType.target.id;
              eClasses[source].get("eSuperTypes").add(eClasses[target]);
            });
           // add the rest of the links
          _.each(references, function(reference) {
              console.log(reference);
              source = reference.source.id;
              target = reference.target.id;
              if (reference.type == "uml.Association"){
                var reference = Ecore.EReference.create({upperBound: -1, lowerBound: 1, eType: eClasses[target]});
                eClasses[source].get('eStructuralFeatures').add(reference);
              }
              if (reference.type == "uml.Composition"){
                var reference = Ecore.EReference.create({upperBound: -1, lowerBound: 1, container:true, eType: eClasses[target]});
                eClasses[source].get('eStructuralFeatures').add(reference);
              } 
            });
           // add methods and parameters
          _.each(classes, function(object) {
            if (object.methods.length != 0) {
                _.each(object.methods, function(method) {                    
                    var operation = Ecore.EOperation.create({name: method.name });
                    if (method.type != "Void"){
                        console.log(method.type);
                        console.log(typeDefinition(method.type));
                        operation.values.eType = typeDefinition(method.type);                            
                    }                
                    if (method.parameters){
                        _.each(method.parameters, function(param) {

                            var parameter = Ecore.EParameter.create({name: param.name});
                                // probably not null and another value
                            if (param.type != null){
                              console.log(typeDefinition(param.type));
                                parameter.values.eType = typeDefinition(param.type);
                            }
                            operation.get('eParameters').add(parameter);
                        });
                    }
                    eClasses[object.id].get('eOperations').add(operation);  
                });            
            }           
            p.get('eClassifiers').add(eClasses[object.id]);      
          });
          var rs = Ecore.ResourceSet.create();
          var r = rs.create({ uri: 'p' });
          r.get('contents').add(p);
          var result = r.to(Ecore.XMI, true);console.log(eClasses);         
         
          return result;          
        }
        else {
          notify({
                 message: "图上没有元素",
                templateUrl: '',
                position: 'right',
                classes: "alert-danger",
                duration: 5000
            });          
        }        
    
        function typeDefinition(type){          
          if (classesForMethods[type]){
              return eClasses[classesForMethods[type]];
          }
          else if (type == "String") {
 			      return Ecore.EString;
          }
          else if (type == "Int") {
 			      return Ecore.EInt;
          }
          else if (type == "Boolean") {
 			      return Ecore.EBoolean;
          }
          else if (type == "Date") {
 			      return Ecore.EDate;
          }
          else if (type == "Double") {
 			      return Ecore.EDouble;
          }
          else if (type == "Long") {
 			      return Ecore.ELong;
          }
          else if (type == "Float") {
 			      return Ecore.EFloat;
          }
          else if (type == "Short") {
 			      return Ecore.EShort;
          }

        }       

      }
    }         
});
