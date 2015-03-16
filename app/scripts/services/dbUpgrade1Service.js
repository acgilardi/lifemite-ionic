(function () {
    'use strict';

    var dbUpgrade1Service = function () {
        return {
            version: 1,
            collections: [
                'organization',
                'incident',
                'management',
                'user'
            ],
            saves: {
            //    organization:[
            //        {
            //            //_id: 1,
            //            name: 'org1 - no-change',
            //            modifyDate: '2011-01-01 01:00:00',
            //            modifyServerDate: '2011-01-01 01:00:00',
            //            synced: true,
            //            deleted: false,
            //            guidId: ' 6c371ee6-ccf1-4643-ba6e-1e5556183946'
            //        },
            //        {
            //            //_id: 2,
            //            name: 'org2 - updated',
            //            modifyDate: '2011-01-11 02:00:00',
            //            modifyServerDate: '2011-01-01 01:00:00',
            //            synced: false,
            //            deleted: false,
            //            guidId: 'ad3b4b1c-8654-47df-9c43-8944d8dd5c6c'
            //        },
            //        {
            //            //_id: 0,
            //            name: 'org3 - new',
            //            modifyDate: '2011-02-22 10:00:00',
            //            modifyServerDate: '',
            //            synced: false,
            //            deleted: false,
            //            guidId: '6e809764-3975-4ee9-a946-60d43edeb566'
            //        },
            //        {
            //            //_id: 4,
            //            name: 'org4 - deleted',
            //            modifyDate: '2011-03-13 03:00:00',
            //            modifyServerDate: '2011-03-03 10:00:00',
            //            synced: false,
            //            deleted: true,
            //            guidId: 'd638bd84-ea07-4286-b6c2-96ecbe7077cf'
            //        }
            //    ],
            //    incident:[
            //        {"id":"4a354d73-72d1-4746-846d-0e0d5c75d9ed","organizationId":"adc2b016-e760-44ff-b185-1593c94ca95b","identifier":null,"name":"Tiny issue 2014","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque fermentum posuere commodo. In ornare, felis vel iaculis efficitur, quam velit iaculis arcu, et fringilla leo eros nec felis. Praesent finibus quis dolor nec blandit. Nullam fringilla ullamcorper dolor in lacinia. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas sit amet nulla sagittis, lacinia leo eu, egestas sem. ","managementOrganizationId":null,"startDate":"2014-01-01T00:00:00","endDate":null,"complexityLevel":null,"locationDescription":null,"latitude":null,"longitude":null,"state":null,"county":null,"city":null,"landSurvey":null,"size":null,"sizeUnit":null,"percentContained":null,"hazmat":null,"weather":null,"cost":null,"costTotal":null,"active":true,"createUserId":null,"createDate":null,"modifyUserId":null,"modifyDate":"2014-12-13T00:00:00","synced":true,"modifyServerDate":"2014-12-13T00:00:00"},
            //        {"id":"062091a1-41c8-4aeb-915f-1cf4dfac29a1","organizationId":"bc9861cd-0f7a-4635-8b1f-0900d4b005b5","identifier":null,"name":"Big incident of 2015 part 1","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque fermentum posuere commodo. In ornare, felis vel iaculis efficitur, quam velit iaculis arcu, et fringilla leo eros nec felis. Praesent finibus quis dolor nec blandit. Nullam fringilla ullamcorper dolor in lacinia. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas sit amet nulla sagittis, lacinia leo eu, egestas sem. ","managementOrganizationId":null,"startDate":"2014-02-02T00:00:00","endDate":null,"complexityLevel":null,"locationDescription":null,"latitude":null,"longitude":null,"state":null,"county":null,"city":null,"landSurvey":null,"size":null,"sizeUnit":null,"percentContained":null,"hazmat":null,"weather":null,"cost":null,"costTotal":null,"active":true,"createUserId":null,"createDate":null,"modifyUserId":null,"modifyDate":"2014-12-13T00:00:00","synced":true,"modifyServerDate":"2014-12-13T00:00:00"},
            //        {"id":"9547ba4a-e92c-4b56-ba15-c3491f91c5ca","organizationId":"bc9861cd-0f7a-4635-8b1f-0900d4b005b5","identifier":null,"name":"Big incident of 2012","description":"Etiam ipsum eros, lobortis dictum fringilla sed, dictum ac nisi. Etiam imperdiet vitae sem eu mattis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ","managementOrganizationId":null,"startDate":"2014-03-03T00:00:00","endDate":null,"complexityLevel":null,"locationDescription":null,"latitude":null,"longitude":null,"state":null,"county":null,"city":null,"landSurvey":null,"size":null,"sizeUnit":null,"percentContained":null,"hazmat":null,"weather":null,"cost":null,"costTotal":null,"active":true,"createUserId":null,"createDate":null,"modifyUserId":null,"modifyDate":"2014-12-13T00:00:00","synced":true,"modifyServerDate":"2014-12-13T00:00:00"},
            //        {"id":"53c1d7ca-866c-4f65-96ef-d3c78d29eaf7","organizationId":"adc2b016-e760-44ff-b185-1593c94ca95b","identifier":null,"name":"Incident of all incidents","description":"Phasellus facilisis magna mauris, vel tristique dolor eleifend sit amet. Vestibulum maximus nisi tellus, quis pharetra sem viverra ac. Nullam non lectus egestas, aliquam nisl commodo, laoreet lectus. Phasellus at suscipit felis, sit amet semper leo. Vestibulum in augue eros. Nam in quam ut odio sagittis consectetur eu nec libero.","managementOrganizationId":null,"startDate":"2014-04-04T00:00:00","endDate":null,"complexityLevel":null,"locationDescription":null,"latitude":null,"longitude":null,"state":null,"county":null,"city":null,"landSurvey":null,"size":null,"sizeUnit":null,"percentContained":null,"hazmat":null,"weather":null,"cost":null,"costTotal":null,"active":true,"createUserId":null,"createDate":null,"modifyUserId":null,"modifyDate":"2014-12-13T00:00:00","synced":true,"modifyServerDate":"2014-12-13T00:00:00"},
            //        {"id":"873f1c2e-355a-4499-ac80-e3cd80703fff","organizationId":"adc2b016-e760-44ff-b185-1593c94ca95b","identifier":null,"name":"Biggest of all 2011","description":"Etiam ipsum eros, lobortis dictum fringilla sed, dictum ac nisi. Etiam imperdiet vitae sem eu mattis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ","managementOrganizationId":null,"startDate":"2014-05-05T00:00:00","endDate":null,"complexityLevel":null,"locationDescription":null,"latitude":null,"longitude":null,"state":null,"county":null,"city":null,"landSurvey":null,"size":null,"sizeUnit":null,"percentContained":null,"hazmat":null,"weather":null,"cost":null,"costTotal":null,"active":true,"createUserId":null,"createDate":null,"modifyUserId":null,"modifyDate":"2014-12-13T00:00:00","synced":true,"modifyServerDate":"2014-12-13T00:00:00"}
            //    ]
            },
            indexes: {
                organization: ['modifyServerDate'],
                incident: ['modifyServerDate'],
                management: ['modifyServerDate']
            }
        };
    };

    angular.module('ehApp').factory('dbUpgrade1Service', dbUpgrade1Service);

})();
