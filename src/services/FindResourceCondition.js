import knex from "../database/db";
const { v4: uuidv4 } = require("uuid");

export class FindResourceCondition {
  async execute(idSumarioIntegracao, newId) {
    const queryResource = await knex.raw(`
    SELECT
    (SELECT CASE 
      WHEN cd_multi_empresa = 1 THEN 'HMSJ'
      WHEN cd_multi_empresa = 2 THEN 'PMP'
      WHEN cd_multi_empresa = 13 THEN 'HMSM'
      END
      FROM atendime
      WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento ) ||'-'|| cd_atendimento AS ID, 
      NOME_COMPLETO,
      DIAGNOSTICO,
      CPF
      FROM DBI_FHIR_SUMARIO_INTERNACAO
     WHERE id_sumario_internacao = ${idSumarioIntegracao}


    `);

    const nomeCompleto = queryResource[0].NOME_COMPLETO;
    const nomeArray = nomeCompleto.split(" ");
    var nomeFinal = "";

    nomeArray.forEach((nome) => {
      if (nome.charAt(0)) {
        nomeFinal += nome.charAt(0);
      }
    });

    const resource = {
      resource: {
        resourceType: "Condition",
        id: `${newId}`,
        subject: {
          type: "Patient",
          reference: `Patient/${queryResource[0].CPF}`,
          display: nomeFinal,
        },
        category: [
          {
            coding: [
              {
                display: "DIAGNOSTICO",
              },
            ],
            text: `${queryResource[0].DIAGNOSTICO}`,
          },
        ],
      },
    };
    return resource;
  }
}
