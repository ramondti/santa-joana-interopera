import knex from "../database/db";

export class FindResourceRelatedPerson {
  async execute(idSumarioIntegracao) {
    const queryResource = await knex.raw(`
    SELECT
    (SELECT CASE 
      WHEN cd_multi_empresa = 1 THEN 'HMSJ'
      WHEN cd_multi_empresa = 2 THEN 'PMP'
      WHEN cd_multi_empresa = 13 THEN 'HMSM'
      END
      FROM atendime
      WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento ) ||'-'|| cd_atendimento AS id,
      cpf ||'-RP' as paciente,
      nome_completo_mae,
      nome_completo,
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

    const nomeCompletoMae = queryResource[0].NOME_COMPLETO_MAE;
    const nomeArrayMae = nomeCompletoMae.split(" ");
    var nomeFinalMae = "";

    nomeArrayMae.forEach((nome) => {
      if (nome.charAt(0)) {
        nomeFinalMae += nome.charAt(0);
      }
    });

    const resource = {
      resource: {
        id: `${queryResource[0].PACIENTE}`,
        resourceType: "RelatedPerson",
        patient: {
          type: "Patient",
          reference: `Patient/${queryResource[0].CPF}`,
          display: nomeFinal,
        },
        relationship: [
          {
            text: "mae",
          },
        ],
        name: [
          {
            use: "official",
            text: nomeFinalMae,
          },
        ],
        language: {
          text: "portuguese",
        },
      },
    };
    return resource;
  }
}
