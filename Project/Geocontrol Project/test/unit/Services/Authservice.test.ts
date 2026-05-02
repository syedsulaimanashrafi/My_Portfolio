import {processToken} from "@services/authService";
import {UserType} from "@models/UserType";
import {UnauthorizedError} from "@errors/UnauthorizedError";
import jwt from "jsonwebtoken";
import {SECRET_KEY} from "@config";


describe('authentication service errors', () => {
    it('test without passing token', async () => {
        await expect(processToken(undefined, [UserType.Admin])).rejects.toThrow(UnauthorizedError);
    })
    it('test without passing token', async () => {
        await expect(processToken(null, [UserType.Admin])).rejects.toThrow(UnauthorizedError);
    })
    it('test with invalid token', async () => {
        await expect(processToken("abc aaa", [UserType.Admin])).rejects.toThrow(UnauthorizedError);
    })
    it('test without passing token', async () => {
        await expect(processToken(undefined)).rejects.toThrow(UnauthorizedError);
    })
    it('test expiring empty', async () => {
        const token = jwt.sign({username: "admin"}, SECRET_KEY, {expiresIn: "1ms"});
        await new Promise(r => setTimeout(r, 10));
        await expect(processToken(`Bearer ${token}`)).rejects.toThrow(UnauthorizedError);
    })
})