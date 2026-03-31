#!/usr/bin/env groovy

import groovy.json.JsonSlurperClassic
import groovy.json.internal.LazyMap

def branch = env.BRANCH_NAME
String[] allowBranches = [
    'develop',
    'develop_sprint',
    'develop_payasyougo',
    'qas_internal',
    'qas_external',
    'prd_external'
]

@Library('piper-lib-os') _

def isValidDeployTarget(aTargets) {
    def isValidTarget = true
    aTargets.each { target ->
        target.each { key, value ->
            echo "Key:${key} - Value:${value}"
            if (value == null) {
                echo "Found null value for property ${key}"
                isValidTarget = false
            } else if (value instanceof String) {
                if (value.trim().isEmpty() || value.trim().toLowerCase() == 'null') {
                    echo "Found empty or 'null' string value for property ${key}"
                    isValidTarget = false
                }
            } else if (value instanceof Collection && value.isEmpty()) {
                echo "Found empty collection for property ${key}"
                isValidTarget = false
            } else if (value instanceof Map && value.isEmpty()) {
                echo "Found empty map for property ${key}"
                isValidTarget = false
            }
        }
    }
    return isValidTarget
}

def teamWebHookEndpoint1 = env.CONARUM_TEAM_WEBHOOK_DTPL1

node() {
    echo "Piper loaded successfully"
    if (allowBranches.contains(branch)) {
        try {
            stage('Info') {
                echo "Branch name : ${branch}"
                office365ConnectorSend(
                    webhookUrl: teamWebHookEndpoint1,
                    message: "Pipeline started - Job: ${env.JOB_NAME}",
                    status: 'STARTED',
                    color: '#0078D4'
                )
                sleep time: 1, unit: 'SECONDS'

            }

            stage('Build') {
                echo "Building app change in branch: ${branch}"
                office365ConnectorSend(
                    webhookUrl: teamWebHookEndpoint1,
                    message: "Building application - Job: ${env.JOB_NAME}",
                    status: 'BUILDING',
                    color: '#be7602'
                )
                sleep time: 1, unit: 'SECONDS'
            }

            stage('Deploy') {
                echo "Deploying the app change in branch: ${branch}"
                office365ConnectorSend(
                    webhookUrl: teamWebHookEndpoint1,
                    message: "Deploying application - Job: ${env.JOB_NAME}",
                    status: 'DEPLOYING',
                    color: '#be7602'
                )
                sleep time: 1, unit: 'SECONDS'

                office365ConnectorSend(
                    webhookUrl: teamWebHookEndpoint1,
                    message: "Pipeline finished successfully - Job: ${env.JOB_NAME}",
                    status: 'SUCCESS',
                    color: '#2EB886'
                )
                sleep time: 1, unit: 'SECONDS'
            }
        } catch (error) {
            office365ConnectorSend(
            webhookUrl: teamWebHookEndpoint1,
            message: "Pipeline FAILED - Job: ${env.JOB_NAME}",
            status: 'FAILED',
            color: '#E81123'
            )
            throw error
        }
    } else {
        stage('Skip Pipeline') {
            echo "Branch name : ${branch} is not allowed. Skipping pipeline."
            office365ConnectorSend(
                webhookUrl: teamWebHookEndpoint1,
                message: "Pipeline skipped for branch ${branch}",
                status: 'SKIPPED',
                color: '#8A8886'
            )
        }
    }
}
