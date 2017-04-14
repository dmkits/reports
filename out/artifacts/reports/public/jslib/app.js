/**
 * Created by ianagez on 15.02.2017.
 */
define(["dijit/registry"],
    function (registry) {
        return {
            instance: function(htmlElemID, Class, params) {
                var instance = registry.byId(htmlElemID);
                if (instance==null) {
                    if (!params) params={};
                    params.id = htmlElemID;
                    instance = new Class(params);
                }
                return instance;
            },
            instanceFor: function(htmlElem, Class, params) {
                var id = htmlElem.getAttribute("id"), instance;
                if (id!=undefined) instance = registry.byId(id);
                if (instance==null) {
                    if (!params) params={};
                    params.id = id;
                    instance = new Class(params, htmlElem);
                }
                return instance;
            },
            instanceForID: function(htmlElemID, Class, params) {
                var instance = registry.byId(htmlElemID);
                if (instance==null) {
                    if (!params) params={};
                    params.id = htmlElemID;
                    instance = new Class(params, htmlElemID);
                }
                return instance;
            },
            childFor: function(parent, ID, Class, params) {
                var instance = registry.byId(ID);
                if (instance==null) {
                    if (!params) params={};
                    params.id = ID;
                    instance = new Class(params);
                    if (parent!=null) parent.addChild(instance);
                }
                return instance;
            },

            /**
             * Inited DOJO element for HTML element
             * @param registry
             * @param ID
             * @param htmlElemName
             * @param Class
             * @param Params
             * @returns {*}
             */
            initElem: function (htmlElemName, Class, Params) {      console.log("initElem");
                var Object = null;
                if (registry!=null) Object = registry.byId(htmlElemName);
                if (Object==null) {
                    Params.id = htmlElemName;
                    Object = new Class(Params, htmlElemName);
                }
                return Object;
            },
            /**
             * Inited DOJO child element for DOJO parent element
             * @param registry
             * @param ID
             * @param Parent
             * @param Class
             * @param Params
             * @returns {*}
             */
            initChildTo: function (Parent, ID, Class, Params) {
                var Object = null;
                if (registry!=null) Object = registry.byId(ID);
                if (Object==null) {
                    Params.id = ID;
                    Object = new Class(Params);
                    if (Parent!=null) Parent.addChild(Object);
                }
                return Object;
            },

            doDialogMsg: function (params){
                //dialog msg
            },
            doRequestErrorDialog: function (){
                this.doDialogMsg({title:"��������",content:"���������� ��������� ��������! <br>��� ����� � ��������!",
                    style:"width:300px;", btnOkLabel:"OK", btnCancelLabel:"�������"});
            },

            today: function (){
                return moment().toDate();
            },
            curMonthBDate: function (){
                return moment().startOf('month').toDate();
            },
            curMonthEDate: function (){
                return moment().endOf('month').toDate();
            }
        }
    });
