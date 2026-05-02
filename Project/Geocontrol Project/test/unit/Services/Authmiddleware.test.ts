import { processToken } from '@services/authService';
import {authenticateUser} from "@middlewares/authMiddleware";

jest.mock('@services/authService');

const mockProcessToken = processToken as jest.MockedFunction<typeof processToken>;
describe('authenticateUser middleware without ', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next(error) when authentication fails', async () => {
        const authError = new Error('Invalid token');
        req.headers.authorization = 'Bearer invalid-token';
        mockProcessToken.mockRejectedValueOnce(authError); // Lancia errore

        const middleware = authenticateUser();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(authError); // next(error) con l'errore
    });
});