"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldDataVizId = exports.certTypeTitleMap = exports.certTypeIdMap = exports.superBlockCertTypeMap = exports.certSlugTypeMap = exports.completionHours = exports.certIds = exports.SuperBlocks = exports.certTypes = void 0;
exports.certTypes = {
    frontEnd: 'isFrontEndCert',
    // backEnd: 'isBackEndCert',
    // dataVis: 'isDataVisCert',
    respWebDesign: 'isRespWebDesignCert',
    frontEndDevLibs: 'isFrontEndLibsCert',
    // // dataVis2018: 'is2018DataVisCert',
    jsAlgoDataStruct: 'isJsAlgoDataStructCert',
    // apisMicroservices: 'isApisMicroservicesCert',
    infosecQa: 'isInfosecQaCert',
    // qaV7: 'isQaCertV7',
    infosecV7: 'isInfosecCertV7',
    sciCompPyV7: 'isSciCompPyCertV7',
    dataAnalysisPyV7: 'isDataAnalysisPyCertV7',
    machineLearningPyV7: 'isMachineLearningPyCertV7',
    // fullStack: 'isFullStackCert',
    // relationalDatabaseV8: 'isRelationalDatabaseCertV8'
};
var SuperBlocks;
(function (SuperBlocks) {
    SuperBlocks["RespWebDesignNew"] = "2022/responsive-web-design";
    SuperBlocks["RespWebDesign"] = "responsive-web-design";
    SuperBlocks["JsAlgoDataStruct"] = "javascript-algorithms-and-data-structures";
    // JsAlgoDataStructNew = '2022/javascript-algorithms-and-data-structures',
    SuperBlocks["FrontEndDevLibs"] = "front-end-development-libraries";
    // DataVis = 'data-visualization',
    // RelationalDb = 'relational-database',
    // BackEndDevApis = 'back-end-development-and-apis',
    // QualityAssurance = 'quality-assurance',
    // SciCompPy = 'scientific-computing-with-python',
    // DataAnalysisPy = 'data-analysis-with-python',
    // InfoSec = 'information-security',
    // MachineLearningPy = 'machine-learning-with-python',
    // CodingInterviewPrep = 'coding-interview-prep'
})(SuperBlocks = exports.SuperBlocks || (exports.SuperBlocks = {}));
exports.certIds = {
    legacyFrontEndChallengeId: '561add10cb82ac38a17513be',
    // legacyBackEndChallengeId: '660add10cb82ac38a17513be',
    // legacyDataVisId: '561add10cb82ac39a17513bc',
    legacyInfosecQaId: '561add10cb82ac38a17213bc',
    // legacyFullStackId: '561add10cb82ac38a17213bd',
    respWebDesignId: '561add10cb82ac38a17513bc',
    frontEndDevLibsId: '561acd10cb82ac38a17513bc',
    // dataVis2018Id: '5a553ca864b52e1d8bceea14',
    jsAlgoDataStructId: '561abd10cb81ac38a17513bc',
    // apisMicroservicesId: '561add10cb82ac38a17523bc',
    // qaV7Id: '5e611829481575a52dc59c0e',
    infosecV7Id: '5e6021435ac9d0ecd8b94b00',
    // sciCompPyV7Id: '5e44431b903586ffb414c951',
    // dataAnalysisPyV7Id: '5e46fc95ac417301a38fb934',
    // machineLearningPyV7Id: '5e46fc95ac417301a38fb935',
    // relationalDatabaseV8Id: '606243f50267e718b1e755f4'
};
exports.completionHours = {
    [exports.certTypes.frontEnd]: 300,
    // [certTypes.backEnd]: 300,
    // [certTypes.dataVis]: 300,
    [exports.certTypes.infosecQa]: 300,
    // [certTypes.fullStack]: 1800,
    [exports.certTypes.respWebDesign]: 300,
    [exports.certTypes.frontEndDevLibs]: 300,
    [exports.certTypes.jsAlgoDataStruct]: 300,
    // [certTypes.dataVis2018]: 300,
    // [certTypes.apisMicroservices]: 300,
    // [certTypes.qaV7]: 300,
    [exports.certTypes.infosecV7]: 300,
    [exports.certTypes.sciCompPyV7]: 300,
    [exports.certTypes.dataAnalysisPyV7]: 300,
    [exports.certTypes.machineLearningPyV7]: 300,
    // [certTypes.relationalDatabaseV8]: 300
};
exports.certSlugTypeMap = {
    // legacy
    'legacy-front-end': exports.certTypes.frontEnd,
    // 'legacy-back-end': certTypes.backEnd,
    // 'legacy-data-visualization': certTypes.dataVis,
    // Keep these slugs the same so we don't
    // break existing links
    'information-security-and-quality-assurance': exports.certTypes.infosecQa,
    // 'full-stack': certTypes.fullStack,
    // modern
    [SuperBlocks.RespWebDesign]: exports.certTypes.respWebDesign,
    [SuperBlocks.RespWebDesignNew]: exports.certTypes.respWebDesign,
    [SuperBlocks.JsAlgoDataStruct]: exports.certTypes.jsAlgoDataStruct,
    // [SuperBlocks.JsAlgoDataStructNew]: certTypes.jsAlgoDataStruct,
    // [SuperBlocks.FrontEndDevLibs]: certTypes.frontEndDevLibs,
    // // [SuperBlocks.DataVis]: certTypes.dataVis2018,
    // [SuperBlocks.BackEndDevApis]: certTypes.apisMicroservices,
    // 'quality-assurance-v7': certTypes.qaV7,
    'information-security-v7': exports.certTypes.infosecV7,
    'scientific-computing-with-python-v7': exports.certTypes.sciCompPyV7,
    'data-analysis-with-python-v7': exports.certTypes.dataAnalysisPyV7,
    'machine-learning-with-python-v7': exports.certTypes.machineLearningPyV7,
    // 'relational-database-v8': certTypes.relationalDatabaseV8
};
exports.superBlockCertTypeMap = {
    // legacy
    'legacy-front-end': exports.certTypes.frontEnd,
    // 'legacy-back-end': certTypes.backEnd,
    // 'legacy-data-visualization': certTypes.dataVis,
    'information-security-and-quality-assurance': exports.certTypes.infosecQa,
    // 'full-stack': certTypes.fullStack,
    // modern
    [SuperBlocks.RespWebDesign]: exports.certTypes.respWebDesign,
    [SuperBlocks.JsAlgoDataStruct]: exports.certTypes.jsAlgoDataStruct,
    // [SuperBlocks.FrontEndDevLibs]: certTypes.frontEndDevLibs,
    // post-modern
    // TODO: use enum
    // [SuperBlocks.RespWebDesignNew]: certTypes.respWebDesign,
    // [SuperBlocks.JsAlgoDataStructNew]: certTypes.jsAlgoDataStruct
};
exports.certTypeIdMap = {
    // [certTypes.frontEnd]: certIds.legacyFrontEndChallengeId,
    // // [certTypes.backEnd]: certIds.legacyBackEndChallengeId,
    // // [certTypes.dataVis]: certIds.legacyDataVisId,
    // [certTypes.infosecQa]: certIds.legacyInfosecQaId,
    // // [certTypes.fullStack]: certIds.legacyFullStackId,
    [exports.certTypes.respWebDesign]: exports.certIds.respWebDesignId,
    // [certTypes.frontEndDevLibs]: certIds.frontEndDevLibsId,
    [exports.certTypes.jsAlgoDataStruct]: exports.certIds.jsAlgoDataStructId,
    // // [certTypes.dataVis2018]: certIds.dataVis2018Id,
    // // [certTypes.apisMicroservices]: certIds.apisMicroservicesId,
    // // [certTypes.qaV7]: certIds.qaV7Id,
    // [certTypes.infosecV7]: certIds.infosecV7Id,
    // [certTypes.sciCompPyV7]: certIds.sciCompPyV7Id,
    // [certTypes.dataAnalysisPyV7]: certIds.dataAnalysisPyV7Id,
    // [certTypes.machineLearningPyV7]: certIds.machineLearningPyV7Id,
    // // [certTypes.relationalDatabaseV8]: certIds.relationalDatabaseV8Id
};
exports.certTypeTitleMap = {
    // [certTypes.frontEnd]: 'Legacy Front End',
    // [certTypes.backEnd]: 'Legacy Back End',
    // [certTypes.dataVis]: 'Legacy Data Visualization',
    // [certTypes.infosecQa]: 'Legacy Information Security and Quality Assurance',
    // [certTypes.fullStack]: 'Legacy Full Stack',
    [exports.certTypes.respWebDesign]: 'Responsive Web Design',
    [exports.certTypes.frontEndDevLibs]: 'Front End Development Libraries',
    [exports.certTypes.jsAlgoDataStruct]: 'JavaScript Algorithms and Data Structures',
    // [certTypes.dataVis2018]: 'Data Visualization',
    // [certTypes.apisMicroservices]: 'Back End Development and APIs',
    // [certTypes.qaV7]: 'Quality Assurance',
    // [certTypes.infosecV7]: 'Information Security',
    // [certTypes.sciCompPyV7]: 'Scientific Computing with Python',
    // [certTypes.dataAnalysisPyV7]: 'Data Analysis with Python',
    // [certTypes.machineLearningPyV7]: 'Machine Learning with Python',
    // [certTypes.relationalDatabaseV8]: 'Relational Database'
};
exports.oldDataVizId = '561add10cb82ac38a17513b3';
