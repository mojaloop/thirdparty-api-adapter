/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Kevin Leyow <kevin.leyow@modusbox.com>

 --------------
 ******/
import { Request } from '@hapi/hapi'
import Logger from '@mojaloop/central-services-logger'

import * as Consents from '~/domain/consents'
import { mockResponseToolkit } from 'test/unit/__mocks__/responseToolkit'
import ConsentsIdHandler from '~/server/handlers/consents/{ID}'

const mockForwardConsentsIdPutRequest = jest.spyOn(Consents, 'forwardConsentsIdRequest')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

const mockPostConsentsIdPutRequest = {
  headers: {
    'fspiop-source': 'auth.dfspA',
    'fspiop-destination': 'pispA'
  },
  params: {
    ID: 'b82348b9-81f6-42ea-b5c4-80667d5740fe'
  },
  payload: {
    requestId: '1b07d64d-ec7d-4582-989b-b6d7608e4218',
    initiatorId: 'pispA',
    participantId: 'dfspA',
    scopes: [
      {
        accountId: 'dfspa.username.1234',
        actions: [ 'accounts.transfer', 'accounts.getBalance' ]
      }
    ],
    credential: {
      type: 'FIDO',
      status: 'PENDING',
      challenge: {
        payload: 'challenge_payload'
      }
    }
  }
}

const mockForwardConsentsIdPutRequestExpected = [
  'b82348b9-81f6-42ea-b5c4-80667d5740fe',
  '/consents/{{ID}}',
  'TP_CB_URL_CONSENT_PUT',
  mockPostConsentsIdPutRequest.headers,
  'PUT',
  mockPostConsentsIdPutRequest.payload,
  undefined
]

describe('consentsId handler', () => {
  describe('PUT /consents/{ID}', () => {
    beforeEach((): void => {
      jest.clearAllMocks()
      mockLoggerPush.mockReturnValue(null)
      mockLoggerError.mockReturnValue(null)
    })

    it('handles a successful request', async () => {
      // Arrange
      mockForwardConsentsIdPutRequest.mockResolvedValueOnce()
      const request = mockPostConsentsIdPutRequest
      const expected = mockForwardConsentsIdPutRequestExpected

      // Act
      const response = await ConsentsIdHandler.put(null, request as unknown as Request, mockResponseToolkit)

      // Assert
      expect(response.statusCode).toBe(202)
      expect(mockForwardConsentsIdPutRequest).toHaveBeenCalledWith(...expected)
    })

    it('handles errors asynchronously', async () => {
      // Arrange
      mockForwardConsentsIdPutRequest.mockRejectedValueOnce(new Error('Test Error'))
      const request = mockPostConsentsIdPutRequest
      const expected = mockForwardConsentsIdPutRequestExpected

      // Act
      const response = await ConsentsIdHandler.put(null, request as unknown as Request, mockResponseToolkit)

      // Assert
      expect(response.statusCode).toBe(202)
      // wait once more for the event loop - since we can't await `runAllImmediates`
      // this helps make sure the tests don't become flaky
      await new Promise(resolve => setImmediate(resolve))
      // The main test here is that there is no unhandledPromiseRejection!
      expect(mockForwardConsentsIdPutRequest).toHaveBeenCalledWith(...expected)
    })

    it('handles validation errors synchronously', async () => {
      // Arrange
      const request = {
        ...mockPostConsentsIdPutRequest,
        // Will setting the span to null do stuff?
        span: {
        }
      }

      // Act
      const action = async () => await ConsentsIdHandler.put(null, request as unknown as Request, mockResponseToolkit)

      // Assert
      await expect(action).rejects.toThrowError('span.setTags is not a function')
    })
  })
})
