import knex from "../database/db";
import axios from "axios";
import { readSync } from "fs";
const { v4: uuidv4 } = require("uuid");
import { FindResourceComposition } from "../services/FindResourceComposition";
import { FindResourceLocation } from "../services/FindResourceLocation";
import { FindResourceOrganization } from "../services/FindResourceOrganization";
import { FindResourcePractitioner } from "../services/FindResourcePractitioner";
import { FindResourcePractitioner2 } from "../services/FindResourcePractitioner2";
import { FindResourceRelatedPerson } from "../services/FindResourceRelatedPerson";
import { FindResourcePatient } from "../services/FindResourcePatient";
import { FindResourceAllergyIntolerance } from "../services/FindResourceAllergyIntolerance";
import { FindResourceCondition } from "../services/FindResourceCondition";
import { FindResourceCondition2 } from "../services/FindResourceCondition2";
import { FindResourceEncounter } from "../services/FindResourceEncounter";
import { FindResourceMedicationRequest } from "../services/FindResourceMedicationRequest";
import { FindResourceProcedure } from "../services/FindResourceProcedure";

FindResourceAllergyIntolerance;

export async function getSantaJoana() {
  try {
    console.log("### INICIANDO PROCESSO ###");
    const findResourceComposition = new FindResourceComposition();
    const findResourceLocation = new FindResourceLocation();
    const findResourceOrganization = new FindResourceOrganization();
    const findResourcePractitioner = new FindResourcePractitioner();
    const findResourcePractitioner2 = new FindResourcePractitioner2();
    const findResourceRelatedPerson = new FindResourceRelatedPerson();
    const findResourcePatient = new FindResourcePatient();
    const findResourceAllergyIntolerance = new FindResourceAllergyIntolerance();
    const findResourceCondition = new FindResourceCondition();
    const findResourceCondition2 = new FindResourceCondition2();
    const findResourceEncounter = new FindResourceEncounter();
    const findResourceMedicationRequest = new FindResourceMedicationRequest();
    const findResourceProcedure = new FindResourceProcedure();

    const URL_SANTA_JOANA = process.env.URL_SANTA_JOANA;

    const newId = uuidv4();
    const newId2 = uuidv4();

    const idDesfecho = newId;
    const idDiagnostico = newId2;

    const getIdSumarioInternacao = await knex.raw(
      `SELECT id_sumario_internacao, cd_atendimento,
        (SELECT cd_item_presc FROM DBINTEGRA.DBI_FHIR_SUMARIO_INTERNACAO internacao
          left JOIN dbintegra.dbi_fhir_medicamento_adm medicamento ON medicamento.cd_atendimento = internacao.cd_atendimento
        WHERE internacao.cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.CD_ATENDIMENTO
        AND ROWNUM = 1) AS MEDICAMENTO  
      FROM DBINTEGRA.DBI_FHIR_SUMARIO_INTERNACAO 
      WHERE sn_status = 'N'  `
    );

    if (!getIdSumarioInternacao || getIdSumarioInternacao.length === 0) {
      console.log("### Não achou nenhum registro");
      return {
        result: "ERROR",
        debug_msg: "Não encontrado registro no banco de dados",
      };
    }

    var sumarioInternacao = getIdSumarioInternacao[0];

    console.log(
      `### Encontrou o atendimento = ${sumarioInternacao.CD_ATENDIMENTO} do Sumario ${sumarioInternacao.ID_SUMARIO_INTERNACAO}`
    );

    const findBundle = await knex.raw(
      ` SELECT
        (SELECT CASE 
        WHEN cd_multi_empresa = 1 THEN 'HMSJ'
        WHEN cd_multi_empresa = 2 THEN 'PMP'
        WHEN cd_multi_empresa = 13 THEN 'HMSM'
        END
        FROM atendime
        WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento ) ||'-'|| cd_atendimento as ID, 
      (SELECT nm_convenio FROM convenio WHERE cd_convenio = (SELECT cd_convenio FROM dbamv.atendime WHERE cd_atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento)) NOME_CONVENIO,
      MEDICAMENTO,
      (SELECT nr_cgc FROM convenio WHERE cd_convenio =  (SELECT cd_convenio FROM atendime WHERE cd_Atendimento = DBI_FHIR_SUMARIO_INTERNACAO.cd_atendimento)) AS CNPJ
    FROM DBI_FHIR_SUMARIO_INTERNACAO
    WHERE id_sumario_internacao = ${sumarioInternacao.ID_SUMARIO_INTERNACAO} `
    );

    if (!findBundle || findBundle.length === 0) {
      console.log("### Não achou nenhum registro de bundle");
      return {
        result: "ERROR",
        debug_msg: "Não encontrado registro no banco de dados",
      };
    }

    var bundle = findBundle[0];

    const result = {
      resourceType: "Bundle",
      id: bundle.ID,
      type: "document",
      identifier: {
        system: "CONVENIO",
        value: `${bundle.CNPJ}`,
      },
      entry: [],
    };

    result.entry.push(
      await findResourceComposition.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourceLocation.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourceOrganization.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourcePractitioner.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourcePractitioner2.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourceRelatedPerson.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourcePatient.execute(sumarioInternacao.ID_SUMARIO_INTERNACAO)
    );

    result.entry.push(
      await findResourceAllergyIntolerance.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    result.entry.push(
      await findResourceCondition.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO,
        idDiagnostico
      )
    );

    result.entry.push(
      await findResourceCondition2.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO,
        idDesfecho
      )
    );

    result.entry.push(
      await findResourceEncounter.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO,
        idDiagnostico,
        idDesfecho
      )
    );

    if (!sumarioInternacao.MEDICAMENTO) {
      console.log("### Não tem medicamento");

      result.entry.push(
        await findResourceProcedure.execute(
          sumarioInternacao.ID_SUMARIO_INTERNACAO
        )
      );

      await knex.raw(
        `UPDATE DBINTEGRA.DBI_FHIR_SUMARIO_INTERNACAO 
          SET sn_status = 'S' 
         WHERE id_sumario_internacao = ${sumarioInternacao.ID_SUMARIO_INTERNACAO} `
      );

      const response = await axios.put(
        `${URL_SANTA_JOANA}${bundle.ID}`,
        result,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("### Envio PUT -> ", response.status);
      console.log("### PROCESSO ENCERRADO ###");

      return result;
    }

    console.log("### Tem medicamento");
    result.entry.push(
      ...(await findResourceMedicationRequest.execute(
        sumarioInternacao.CD_ATENDIMENTO
      ))
    );

    result.entry.push(
      await findResourceProcedure.execute(
        sumarioInternacao.ID_SUMARIO_INTERNACAO
      )
    );

    await knex.raw(
      `UPDATE DBINTEGRA.DBI_FHIR_SUMARIO_INTERNACAO 
        SET sn_status = 'S' 
       WHERE id_sumario_internacao = ${sumarioInternacao.ID_SUMARIO_INTERNACAO} `
    );

    const response = await axios.put(`${URL_SANTA_JOANA}${bundle.ID}`, result, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("### Envio PUT -> ", response.status);

    console.log("### PROCESSO ENCERRADO ###");
    return result;
  } catch (error) {
    return console.log(error);
  }
}
