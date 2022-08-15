import knex from "../database/db";

export class FindResourceEncounter {
  async execute(idSumarioIntegracao, newId, newId2) {
    const queryResource = await knex.raw(`

    SELECT
    (SELECT CASE 
      WHEN cd_multi_empresa = 1 THEN 'HMSJ'
      WHEN cd_multi_empresa = 2 THEN 'PMP'
      WHEN cd_multi_empresa = 13 THEN 'HMSM'
      END
      FROM atendime
      WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento ) AS id, 
      CD_ATENDIMENTO,
      NOME_COMPLETO,
      CPF,
      NOME_PROFISSIONAL,
      (SELECT nr_cgc FROM convenio WHERE cd_convenio =  (SELECT cd_convenio FROM atendime WHERE cd_Atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento)) AS CNPJ,
      numero_registro AS CRM,
      (SELECT ds_multi_empresa FROM multi_empresas WHERE cd_multi_empresa = (SELECT cd_multi_empresa FROM atendime WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento )) AS HOSPITAL,
      profissional_alta_medica,
      cd_prestador_alta_medica,
      (SELECT nm_convenio FROM convenio WHERE cd_convenio = (SELECT cd_convenio FROM atendime WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento)) AS NOME_CONVENIO,
      (CASE WHEN DATA_HORA_ATENDIMENTO IS NOT NULL THEN To_Char(DATA_HORA_ATENDIMENTO, 'YYYY-MM-DD')||'T'||(To_Char(DATA_HORA_ATENDIMENTO, 'HH24:MI:SS')) ELSE NULL END) AS INICIO,
      (CASE WHEN DATA_ALTA_MEDICA IS NOT NULL THEN To_Char(DATA_ALTA_MEDICA, 'YYYY-MM-DD')||'T'||(To_Char(DATA_ALTA_MEDICA, 'HH24:MI:SS')) ELSE '' END) AS FIM
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

    const nomeCompletoMedico = queryResource[0].NOME_PROFISSIONAL;
    const nomeArrayMedico = nomeCompletoMedico.split(" ");
    var nomeFinalMedico = "";

    nomeArrayMedico.forEach((nome) => {
      if (nome.charAt(0)) {
        nomeFinalMedico += nome.charAt(0);
      }
    });

    const nomeCompletoMedicoAlta = queryResource[0].NOME_PROFISSIONAL;
    const nomeArrayMedicoAlta = nomeCompletoMedicoAlta.split(" ");
    var nomeFinalMedicoAlta = "";

    nomeArrayMedicoAlta.forEach((nome) => {
      if (nome.charAt(0)) {
        nomeFinalMedicoAlta += nome.charAt(0);
      }
    });

    const resource = {
      resource: {
        resourceType: "Encounter",
        identifier: [
          {
            type: {
              text: "CD_ATENDIMENTO",
            },
            value: `${queryResource[0].CD_ATENDIMENTO}`,
          },
        ],
        type: [
          {
            text: "HOSPITALAR",
          },
        ],
        subject: {
          type: "Patient",
          reference: `Patient/${queryResource[0].CPF}`,
          display: nomeFinal,
        },
        reasonReference: [
          {
            reference: `Condition/${newId}`,
            type: "Condition",
          },
        ],
        period: {
          start: queryResource[0].INICIO,
          end: queryResource[0].FIM,
        },
        status: "finished",
        participant: [
          {
            type: [
              {
                text: "PROFISSIONAL_ADMISSAO",
              },
            ],
            individual: {
              reference: `Practitioner/${queryResource[0].CRM}`,
              type: "Practitioner",
              display: nomeFinalMedico,
            },
          },
          {
            type: [
              {
                text: "PROFISSIONAL_ALTA",
              },
            ],
            individual: {
              reference: `Practitioner/${queryResource[0].CD_PRESTADOR_ALTA_MEDICA}`,
              type: "Practitioner",
              display: nomeFinalMedicoAlta,
            },
          },
        ],
        diagnosis: [
          {
            condition: {
              reference: `Condition/${newId2}`,
              type: "Condition",
            },
            use: {
              text: "Desfecho",
            },
          },
        ],
        location: [
          {
            location: {
              reference: `Location/${queryResource[0].ID}`,
              type: "Location",
              display: queryResource[0].HOSPITAL,
            },
          },
        ],
        serviceProvider: {
          reference: `Organization/${queryResource[0].CNPJ}`,
          type: "Organization",
          display: `${queryResource[0].NOME_CONVENIO}`,
        },
      },
    };
    return resource;
  }
}
