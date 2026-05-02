import {
    findOrThrowNotFound,
    throwConflictIfFound,
    parseISODateParamToUTC,
    parseStringArrayParam
} from '@utils';
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

describe('Utils Functions', () => {

    describe('findOrThrowNotFound', () => {
        const testArray = [
            { id: 1, name: 'Zara' },
            { id: 2, name: 'Yusuf' },
            { id: 3, name: 'Lena' }
        ];

        it('should return the found item when predicate matches', () => {
            const result = findOrThrowNotFound(
                testArray,
                item => item.id === 2,
                'User not found'
            );

            expect(result).toEqual({ id: 2, name: 'Yusuf' });
        });

        it('should throw NotFoundError when no item matches predicate', () => {
            expect(() => {
                findOrThrowNotFound(
                    testArray,
                    item => item.id === 999,
                    'User not found'
                );
            }).toThrow(NotFoundError);
        });

        it('should throw NotFoundError with custom error message', () => {
            const customMessage = 'Custom error message';
            expect(() => {
                findOrThrowNotFound(
                    testArray,
                    item => item.id === 999,
                    customMessage
                );
            }).toThrow(customMessage);
        });

        it('should work with empty array', () => {
            expect(() => {
                findOrThrowNotFound(
                    [],
                    item => true,
                    'Nothing found in empty array'
                );
            }).toThrow(NotFoundError);
        });
    });

    describe('throwConflictIfFound', () => {
        const testArray = [
            { id: 1, email: 'zara@example.com' },
            { id: 2, email: 'yusuf@example.com' },
            { id: 3, email: 'lena@example.com' }
        ];

        it('should throw ConflictError when predicate matches an item', () => {
            expect(() => {
                throwConflictIfFound(
                    testArray,
                    item => item.email === 'zara@example.com',
                    'Email already exists'
                );
            }).toThrow(ConflictError);
        });

        it('should throw ConflictError with custom error message', () => {
            const customMessage = 'Custom conflict message';
            expect(() => {
                throwConflictIfFound(
                    testArray,
                    item => item.email === 'zara@example.com',
                    customMessage
                );
            }).toThrow(customMessage);
        });

        it('should not throw when no item matches predicate', () => {
            expect(() => {
                throwConflictIfFound(
                    testArray,
                    item => item.email === 'nina@example.com',
                    'Email already exists'
                );
            }).not.toThrow();
        });

        it('should not throw with empty array', () => {
            expect(() => {
                throwConflictIfFound(
                    [],
                    item => true,
                    'Should not throw'
                );
            }).not.toThrow();
        });
    });

    describe('parseISODateParamToUTC', () => {
        it('should parse valid ISO date string', () => {
            const dateString = '2025-03-22T15:45:00.000Z';
            const result = parseISODateParamToUTC(dateString);

            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe('2025-03-22T15:45:00.000Z');
        });

        it('should parse URL encoded ISO date string', () => {
            const encodedDateString = encodeURIComponent('2025-03-22T15:45:00.000Z');
            const result = parseISODateParamToUTC(encodedDateString);

            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe('2025-03-22T15:45:00.000Z');
        });

        it('should parse date without timezone (local date)', () => {
            const dateString = '2025-03-22T15:45:00';
            const result = parseISODateParamToUTC(dateString);

            expect(result).toBeInstanceOf(Date);
        });

        it('should return undefined for invalid date string', () => {
            const invalidDateString = 'not-a-date';
            const result = parseISODateParamToUTC(invalidDateString);

            expect(result).toBeUndefined();
        });

        it('should return undefined for non-string parameter', () => {
            expect(parseISODateParamToUTC(456)).toBeUndefined();
            expect(parseISODateParamToUTC(null)).toBeUndefined();
            expect(parseISODateParamToUTC(undefined)).toBeUndefined();
            expect(parseISODateParamToUTC({})).toBeUndefined();
            expect(parseISODateParamToUTC([])).toBeUndefined();
        });

        it('should return undefined for empty string', () => {
            const result = parseISODateParamToUTC('');
            expect(result).toBeUndefined();
        });

        it('should handle date with special characters that need URL decoding', () => {
            const dateWithPlus = '2025-03-22T15%3A45%3A00.000Z'; // URL encoded colons
            const result = parseISODateParamToUTC(dateWithPlus);

            expect(result).toBeInstanceOf(Date);
        });
    });

    describe('parseStringArrayParam', () => {
        describe('string parameter branch', () => {
            it('should parse a single string parameter', () => {
                const result = parseStringArrayParam('00:11:22:33:44:55');

                expect(result).toEqual(['00:11:22:33:44:55']);
            });

            it('should parse a comma-separated string parameter', () => {
                const result = parseStringArrayParam('00:11:22:33:44:55,66:77:88:99:AA:BB,CC:DD:EE:FF:00:11');

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB',
                    'CC:DD:EE:FF:00:11'
                ]);
            });

            it('should handle string with spaces and trim them', () => {
                const result = parseStringArrayParam('  00:11:22:33:44:55  ,  66:77:88:99:AA:BB  ');

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB'
                ]);
            });

            it('should filter out empty strings after splitting', () => {
                const result = parseStringArrayParam('00:11:22:33:44:55,,66:77:88:99:AA:BB,');

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB'
                ]);
            });

            it('should return empty array for string with only commas and spaces', () => {
                const result = parseStringArrayParam('  ,  ,  ');

                expect(result).toEqual([]);
            });

            it('should handle empty string', () => {
                const result = parseStringArrayParam('');

                expect(result).toEqual([]);
            });
        });

        describe('array parameter branch', () => {
            it('should handle array of strings', () => {
                const result = parseStringArrayParam(['00:11:22:33:44:55', '66:77:88:99:AA:BB']);

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB'
                ]);
            });

            it('should handle array with mixed types (convert non-strings to empty)', () => {
                const result = parseStringArrayParam(['00:11:22:33:44:55', 789, null, '66:77:88:99:AA:BB']);

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB'
                ]);
            });

            it('should trim strings in array and filter empty ones', () => {
                const result = parseStringArrayParam(['  00:11:22:33:44:55  ', '', '  ', '66:77:88:99:AA:BB']);

                expect(result).toEqual([
                    '00:11:22:33:44:55',
                    '66:77:88:99:AA:BB'
                ]);
            });

                        it('should handle empty array', () => {
                const result = parseStringArrayParam([]);

                expect(result).toEqual([]);
            });

            it('should handle array with only non-string values', () => {
                const result = parseStringArrayParam([789, null, undefined, {}]);

                expect(result).toEqual([]);
            });
        });

        describe('undefined return branch', () => {
            it('should return undefined for non-string non-array parameters', () => {
                expect(parseStringArrayParam(456)).toBeUndefined();
                expect(parseStringArrayParam(null)).toBeUndefined();
                expect(parseStringArrayParam(undefined)).toBeUndefined();
                expect(parseStringArrayParam({})).toBeUndefined();
                expect(parseStringArrayParam(true)).toBeUndefined();
            });

            it('should return undefined when no parameter is passed', () => {
                const result = parseStringArrayParam();
                expect(result).toBeUndefined();
            });
        });
    });
});

