"use strict";angular.module("chayka-email",["chayka-wp-admin"]).directive("emailTestForm",["ajax",function(ajax){return{controllerAs:"ctrl",template:'<form data-form-validator="ctrl.validator" novalidate="novalidate">   <div class="form_field fullsize" data-form-field="to" data-check-required="Please specify email address" data-check-email="Should be a valid email">       <label>To (email)</label><input type="text" data-ng-model="ctrl.fields.to" title="To (email)"/>   </div>   <div class="form_field fullsize" data-form-field="message">       <label>Message</label><textarea data-ng-model="ctrl.fields.message" title="Message"></textarea>   </div>   <div class="buttons">       <button class="button button-primary button-large" data-ng-click="ctrl.send();">Send</button>   </div></form>',controller:function(){var ctrl={fields:{to:"",message:""},validator:null,send:function(){ajax.post("/api/email/test",ctrl.fields,{formValidator:ctrl.validator,spinnerMessage:"Sending email...",success:function(data){}})}};return ctrl}}}]).controller("test",["$scope","ajax",function($scope,ajax){$scope.fields={to:"",message:""},$scope.validator=null,$scope.send=function(){$scope.validator.validateFields()&&ajax.post("/api/admin-email/test",$scope.fields,{formValidator:$scope.validator,spinnerMessage:"Sending email...",success:function(data){}})}}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXlrYS1lbWFpbC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZGlyZWN0aXZlIiwiYWpheCIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlIiwiY29udHJvbGxlciIsImN0cmwiLCJmaWVsZHMiLCJ0byIsIm1lc3NhZ2UiLCJ2YWxpZGF0b3IiLCJzZW5kIiwicG9zdCIsImZvcm1WYWxpZGF0b3IiLCJzcGlubmVyTWVzc2FnZSIsInN1Y2Nlc3MiLCJkYXRhIiwiJHNjb3BlIiwidmFsaWRhdGVGaWVsZHMiXSwibWFwcGluZ3MiOiJBQUFBLFlBRUFBLFNBQVFDLE9BQU8sZ0JBQWlCLG9CQUMzQkMsVUFBVSxpQkFBa0IsT0FBUSxTQUFTQyxNQUMxQyxPQUNJQyxhQUFjLE9BQ2RDLFNBQ0EscW9CQVdBQyxXQUFZLFdBQ1IsR0FBSUMsT0FDQUMsUUFDSUMsR0FBSSxHQUNKQyxRQUFTLElBR2JDLFVBQVcsS0FFWEMsS0FBTSxXQUVFVCxLQUFLVSxLQUFLLGtCQUFtQk4sS0FBS0MsUUFDOUJNLGNBQWVQLEtBQUtJLFVBQ3BCSSxlQUFnQixtQkFDaEJDLFFBQVMsU0FBU0MsV0FRbEMsT0FBT1YsV0FPbEJELFdBQVcsUUFBUyxTQUFVLE9BQVEsU0FBU1ksT0FBUWYsTUFDcERlLE9BQU9WLFFBQ0hDLEdBQUksR0FDSkMsUUFBUyxJQUdiUSxPQUFPUCxVQUFZLEtBRW5CTyxPQUFPTixLQUFPLFdBQ1BNLE9BQU9QLFVBQVVRLGtCQUNoQmhCLEtBQUtVLEtBQUssd0JBQXlCSyxPQUFPVixRQUN0Q00sY0FBZUksT0FBT1AsVUFDdEJJLGVBQWdCLG1CQUNoQkMsUUFBUyxTQUFTQyIsImZpbGUiOiJjaGF5a2EtZW1haWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdjaGF5a2EtZW1haWwnLCBbJ2NoYXlrYS13cC1hZG1pbiddKVxuICAgIC5kaXJlY3RpdmUoJ2VtYWlsVGVzdEZvcm0nLCBbJ2FqYXgnLCBmdW5jdGlvbihhamF4KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuICAgICAgICAgICAgdGVtcGxhdGU6IFxuICAgICAgICAgICAgJzxmb3JtIGRhdGEtZm9ybS12YWxpZGF0b3I9XCJjdHJsLnZhbGlkYXRvclwiIG5vdmFsaWRhdGU9XCJub3ZhbGlkYXRlXCI+JyArXG4gICAgICAgICAgICAnICAgPGRpdiBjbGFzcz1cImZvcm1fZmllbGQgZnVsbHNpemVcIiBkYXRhLWZvcm0tZmllbGQ9XCJ0b1wiIGRhdGEtY2hlY2stcmVxdWlyZWQ9XCJQbGVhc2Ugc3BlY2lmeSBlbWFpbCBhZGRyZXNzXCIgZGF0YS1jaGVjay1lbWFpbD1cIlNob3VsZCBiZSBhIHZhbGlkIGVtYWlsXCI+JyArXG4gICAgICAgICAgICAnICAgICAgIDxsYWJlbD5UbyAoZW1haWwpPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBkYXRhLW5nLW1vZGVsPVwiY3RybC5maWVsZHMudG9cIiB0aXRsZT1cIlRvIChlbWFpbClcIi8+JyArXG4gICAgICAgICAgICAnICAgPC9kaXY+JyArXG4gICAgICAgICAgICAnICAgPGRpdiBjbGFzcz1cImZvcm1fZmllbGQgZnVsbHNpemVcIiBkYXRhLWZvcm0tZmllbGQ9XCJtZXNzYWdlXCI+JyArXG4gICAgICAgICAgICAnICAgICAgIDxsYWJlbD5NZXNzYWdlPC9sYWJlbD48dGV4dGFyZWEgZGF0YS1uZy1tb2RlbD1cImN0cmwuZmllbGRzLm1lc3NhZ2VcIiB0aXRsZT1cIk1lc3NhZ2VcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgJyAgIDwvZGl2PicgK1xuICAgICAgICAgICAgJyAgIDxkaXYgY2xhc3M9XCJidXR0b25zXCI+JyArXG4gICAgICAgICAgICAnICAgICAgIDxidXR0b24gY2xhc3M9XCJidXR0b24gYnV0dG9uLXByaW1hcnkgYnV0dG9uLWxhcmdlXCIgZGF0YS1uZy1jbGljaz1cImN0cmwuc2VuZCgpO1wiPlNlbmQ8L2J1dHRvbj4nICtcbiAgICAgICAgICAgICcgICA8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+JyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkczp7XG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgc2VuZDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKGN0cmwudmFsaWRhdG9yLnZhbGlkYXRlRmllbGRzKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdCgnL2FwaS9lbWFpbC90ZXN0JywgY3RybC5maWVsZHMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybVZhbGlkYXRvcjogY3RybC52YWxpZGF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXJNZXNzYWdlOiAnU2VuZGluZyBlbWFpbC4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kc2NvcGUudmFsaWRhdG9yLnNob3dNZXNzYWdlKGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWRcbiAgICAgKi9cbiAgICAuY29udHJvbGxlcigndGVzdCcsIFsnJHNjb3BlJywgJ2FqYXgnLCBmdW5jdGlvbigkc2NvcGUsIGFqYXgpe1xuICAgICAgICAkc2NvcGUuZmllbGRzID0ge1xuICAgICAgICAgICAgdG86ICcnLFxuICAgICAgICAgICAgbWVzc2FnZTogJydcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudmFsaWRhdG9yID0gbnVsbDtcblxuICAgICAgICAkc2NvcGUuc2VuZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZigkc2NvcGUudmFsaWRhdG9yLnZhbGlkYXRlRmllbGRzKCkpe1xuICAgICAgICAgICAgICAgIGFqYXgucG9zdCgnL2FwaS9hZG1pbi1lbWFpbC90ZXN0JywgJHNjb3BlLmZpZWxkcywge1xuICAgICAgICAgICAgICAgICAgICBmb3JtVmFsaWRhdG9yOiAkc2NvcGUudmFsaWRhdG9yLFxuICAgICAgICAgICAgICAgICAgICBzcGlubmVyTWVzc2FnZTogJ1NlbmRpbmcgZW1haWwuLi4nLFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJHNjb3BlLnZhbGlkYXRvci5zaG93TWVzc2FnZShkYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
