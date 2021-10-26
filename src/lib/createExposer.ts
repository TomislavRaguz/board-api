import { ObjectId } from "bson";
import { Query, Model } from "mongoose";
import { optional, type, validate } from "superstruct";
import { APIError, sStringInt } from ".";

const GetListQueryParams = type({
  limit: optional(sStringInt),
  offset: optional(sStringInt)
})
export function createCollectionExposer<T extends (key: string) => any>(exposerOptions: { 
  EnhancedModel: Model<any> & { getSelectSet: T },
  limit: { max: number, default: number },
  allowedSelectSets: Array<Parameters<T>[0]>
}) {
  const exposeListBase = async (params: {
    sort?: string
    limit?: string
    offset?: string,
    filter?: string,
    selectset?: Parameters<T>[0]
  }, options?: {
    returnDocuments?: boolean,
    queryCb?: (query:Query<any, any>) => Query<any, any>
  }) => {
    let [err, parsedParams] = validate(params, GetListQueryParams, { coerce: true })
    if(!options) options = {};
    if(err || !parsedParams) throw Error("query param err")
    let query = exposerOptions.EnhancedModel.find()
    let selectSet = exposerOptions.EnhancedModel.getSelectSet(exposerOptions.allowedSelectSets[0]);
    if (params.selectset) {
      if(!exposerOptions.allowedSelectSets.includes(params.selectset)) throw APIError({
        code: "INVALID FIELDSET",
        statusCode: 403
      })
      const selectedSelectSet = exposerOptions.EnhancedModel.getSelectSet(params.selectset)//exposerOptions.fieldSets[params.fieldset]
      if(!selectedSelectSet) throw Error(`No fieldset found with key ${params.selectset}`)
      selectSet = selectedSelectSet;
    }
    query.select(selectSet.keys)

    if(selectSet.populate && selectSet.populate.length) {
      query.populate(selectSet.populate)
    }
    
    if(!options.returnDocuments) {
      query.lean()
    }
    let limit = parsedParams.limit || exposerOptions.limit.default || 10
    if(limit >  (exposerOptions.limit.max || 50)) limit = exposerOptions.limit.max || 50
    query.limit(limit);
    if(parsedParams.offset) query.skip(parsedParams.offset)
 
    if(params.sort) {
      // ime dozvoljene kolumne i more bit -ispred
      let isSortingAllowed = false;
      //@ts-ignore
      const sortKey = params.sort[0] === '-' ? params.sort.substring(1) : params.sort;
      for(let i = 0; i < selectSet.keys.length; i++) {
        if(sortKey === selectSet.keys[i]) {
          isSortingAllowed = true;
          break;
        }
      }
      if(isSortingAllowed) {
        query.sort(params.sort)
      } else {
        throw Error("ugh nemas pristup kljucu po kojem si sorto")
      }
    }
    if(params.filter) {

    }
    if(options.queryCb) {
      query = options.queryCb(query)
    }
    const elements = await query;
    if(!options.returnDocuments) {
      for(let i = 0; i < elements.length; i++) {
        elements[i].ID = exposerOptions.EnhancedModel.prototype.collection.modelName + ":" + elements[i]._id;
      }
    }
    return elements;
  }

  const exposeOneBase = async (id: ObjectId, params: {
    selectset?: Parameters<T>[0]
  }, options ?: {
    returnDocuments?: boolean,
    queryCb?: (query:Query<any, any>) => Query<any, any>
  }) => {
    let query = exposerOptions.EnhancedModel.findById(id) //getOneById(id)
    let selectSet = exposerOptions.EnhancedModel.getSelectSet(exposerOptions.allowedSelectSets[0]);
    if (params.selectset) {
      if(!exposerOptions.allowedSelectSets.includes(params.selectset)) throw APIError({
        code: "INVALID FIELDSET",
        statusCode: 403
      })
      const selectedSelectSet = exposerOptions.EnhancedModel.getSelectSet(params.selectset)//exposerOptions.fieldSets[params.fieldset]
      if(!selectedSelectSet) throw Error(`No fieldset found with key ${params.selectset}`)
      selectSet = selectedSelectSet;
    }
    query.select(selectSet.keys)

    if(selectSet.populate && selectSet.populate.length) {
      query.populate(selectSet.populate)
    }

    if(!options) options = {};
    if(!options.returnDocuments) {
      query.lean()
    }
    if(options.queryCb) {
      query = options.queryCb(query)
    }

    const element = await query;

    if(!element) throw APIError({
      code: `GET_ONE:${exposerOptions.EnhancedModel.prototype.collection.modelName.toUpperCase()}:404`,
      statusCode: 404
    })
    if(!options.returnDocuments) {
      /*for(let i = 0; i < boards.length; i++) {
        boards[i].ID = exposerOptions.EnhancedModel.prototype.collection.modelName + ":" + boards[i]._id;
      }*/
      element.ID = exposerOptions.EnhancedModel.prototype.collection.modelName + ":" + element._id;
    }
    return element;
  }
  return { exposeListBase, exposeOneBase }
}
